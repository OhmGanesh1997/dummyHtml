import re

import gradio as gr
import modelscope_studio.components.antd as antd
import modelscope_studio.components.base as ms
import modelscope_studio.components.pro as pro
from openai import OpenAI
from config import API_KEY, MODEL, SYSTEM_PROMPT, ENDPOINT, EXAMPLES, DEFAULT_LOCALE, DEFAULT_THEME

client = OpenAI(api_key=API_KEY, base_url=ENDPOINT)

# Tunables for generation length/quality
DEFAULT_MAX_TOKENS = 8192  # bump this if your endpoint supports more
DEFAULT_TEMPERATURE = 0.2
MAX_CONTINUATIONS = 4      # auto-continue chunks if the API stops on length

react_imports = {
    "lucide-react": "https://esm.sh/lucide-react@0.525.0",
    "recharts": "https://esm.sh/recharts@3.1.0",
    "framer-motion": "https://esm.sh/framer-motion@12.23.6",
    "matter-js": "https://esm.sh/matter-js@0.20.0",
    "p5": "https://esm.sh/p5@2.0.3",
    "konva": "https://esm.sh/konva@9.3.22",
    "react-konva": "https://esm.sh/react-konva@19.0.7",
    "three": "https://esm.sh/three@0.178.0",
    "@react-three/fiber": "https://esm.sh/@react-three/fiber@9.2.0",
    "@react-three/drei": "https://esm.sh/@react-three/drei@10.5.2",
    "@tailwindcss/browser": "https://esm.sh/@tailwindcss/browser@4.1.11",
    "react": "https://esm.sh/react@^19.0.0",
    "react/": "https://esm.sh/react@^19.0.0/",
    "react-dom": "https://esm.sh/react-dom@^19.0.0",
    "react-dom/": "https://esm.sh/react-dom@^19.0.0/"
}


class GradioEvents:

    @staticmethod
    def generate_code(input_value, system_prompt_input_value, state_value):
        """Stream the model response, auto-continue on length cutoffs,
        and only parse files after the full text is assembled."""

        def get_generated_files(text: str):
            """Extract code blocks from model text. Handles closed fences first,
            then open-to-EOF, and finally heuristics for raw HTML/React.
            Returns a dict like { 'index.tsx': '...', 'index.html': '...' }.
            """
            patterns_closed = [
                (r"```(tsx)[^\n]*\n([\s\S]+?)\n```", "index.tsx"),
                (r"```(jsx)[^\n]*\n([\s\S]+?)\n```", "index.jsx"),
                (r"```(html)[^\n]*\n([\s\S]+?)\n```", "index.html"),
            ]
            patterns_open = [
                (r"```(tsx)[^\n]*\n([\s\S]+)$", "index.tsx"),
                (r"```(jsx)[^\n]*\n([\s\S]+)$", "index.jsx"),
                (r"```(html)[^\n]*\n([\s\S]+)$", "index.html"),
            ]

            result = {}

            # 1) Closed fences
            for pattern, name in patterns_closed:
                for _, content in re.findall(pattern, text, re.DOTALL | re.IGNORECASE):
                    content = content.strip()
                    # If we already captured one, prefer the first occurrence
                    result.setdefault(name, content)

            # 2) Open-to-EOF fallback (in case model forgot the closing ```)
            if not result:
                for pattern, name in patterns_open:
                    m = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                    if m:
                        content = m.group(2).strip()
                        result[name] = content
                        break

            # 3) Heuristics when no fences exist
            if not result:
                lowered = text.lower()
                # Try to carve HTML from the first <html> (or <!doctype) to the end
                m = re.search(r"(?is)(<!doctype html[\s\S]*|<html\b[\s\S]*)", text)
                if m:
                    result["index.html"] = m.group(1).strip()
                else:
                    # Assume React/TSX if typical react markers are present
                    if any(s in text for s in ["export default", "ReactDOM", "useState(", "useEffect("]):
                        result["index.tsx"] = text.strip()
                    else:
                        # Fallback: dump everything as HTML
                        result["index.html"] = text.strip()

            return result

        # UI: show loading state
        yield {
            output_loading: gr.update(spinning=True),
            state_tab: gr.update(active_key="loading"),
            output: gr.update(value=None),
        }

        if not input_value:
            input_value = ""

        # Build base messages. Prefer using the configured system prompt.
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + state_value["history"]
        messages.append({"role": "user", "content": (
            input_value +
            "\n\nReturn ONLY one fenced code block: ```tsx or ```html. No explanations."
        )})

        response = ""
        finish_reason = None
        continuations = 0

        def stream_once(msgs):
            nonlocal response, finish_reason
            partial = ""
            stream = client.chat.completions.create(
                model=MODEL,
                messages=msgs,
                stream=True,
                temperature=DEFAULT_TEMPERATURE,
                max_tokens=DEFAULT_MAX_TOKENS,
            )
            for chunk in stream:
                choice = chunk.choices[0]
                delta = getattr(choice.delta, "content", None)
                if delta:
                    response += delta
                    partial += delta
                    # live-update output text
                    yield {output: gr.update(value=response)}
                # record finish reason if present
                if getattr(choice, "finish_reason", None) is not None:
                    finish_reason = choice.finish_reason
            return partial

        # First pass
        partial_text = None
        for update in stream_once(messages):
            yield update
        partial_text = response  # after first pass

        # Auto-continue if we hit the token limit
        while finish_reason == "length" and continuations < MAX_CONTINUATIONS:
            continuations += 1
            # Add the assistant partial, then ask to continue with code ONLY
            messages.append({"role": "assistant", "content": partial_text})
            messages.append({
                "role": "user",
                "content": (
                    "⏩ CONTINUE EXACTLY from where you stopped. Output ONLY the remaining code. "
                    "No explanations, no headers. If a code fence was open, reopen the same fence (```tsx or ```html) "
                    "and finish the code, then close the fence with ``` at the end."
                )
            })

            # next pass
            new_partial = ""
            for update in stream_once(messages):
                # accumulate live updates
                yield update
            new_partial = response[len(partial_text):]
            partial_text = response

        # We've finished assembling the full text by here
        state_value["history"] = messages + [{"role": "assistant", "content": response}]

        generated_files = get_generated_files(response)
        react_code = generated_files.get("index.tsx") or generated_files.get("index.jsx")
        html_code = generated_files.get("index.html")

        # Prepare sandbox payload
        if react_code:
            sandbox_value = {
                "./index.tsx": """import Demo from './demo.tsx'\nimport \"@tailwindcss/browser\"\n\nexport default Demo\n""",
                "./demo.tsx": react_code or "",
            }
            sandbox_template = "react"
            sandbox_imports = react_imports
            download_payload = react_code
        else:
            sandbox_value = {"./index.html": html_code or ""}
            sandbox_template = "html"
            sandbox_imports = {}
            download_payload = html_code

        yield {
            output: gr.update(value=response),
            download_content: gr.update(value=download_payload or ""),
            output_loading: gr.update(spinning=False),
            sandbox: gr.update(
                template=sandbox_template,
                imports=sandbox_imports,
                value=sandbox_value,
            ),
            state: gr.update(value=state_value),
        }

        # Switch to render tab
        yield {state_tab: gr.update(active_key="render")}

    @staticmethod
    def select_example(example: dict):
        return lambda: gr.update(value=example["description"])

    @staticmethod
    def close_modal():
        return gr.update(open=False)

    @staticmethod
    def open_modal():
        return gr.update(open=True)

    @staticmethod
    def disable_btns(btns: list):
        return lambda: [gr.update(disabled=True) for _ in btns]

    @staticmethod
    def enable_btns(btns: list):
        return lambda: [gr.update(disabled=False) for _ in btns]

    @staticmethod
    def update_system_prompt(system_prompt_input_value, state_value):
        state_value["system_prompt"] = system_prompt_input_value
        return gr.update(value=state_value)

    @staticmethod
    def reset_system_prompt(state_value):
        return gr.update(value=state_value["system_prompt"])

    @staticmethod
    def render_history(statue_value):
        return gr.update(value=statue_value["history"])

    @staticmethod
    def clear_history(state_value):
        gr.Success("History Cleared.")
        state_value["history"] = []
        return gr.update(value=state_value)


css = """
#coder-artifacts .output-empty,.output-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 680px;
}

#coder-artifacts #output-container .ms-gr-ant-tabs-content,.ms-gr-ant-tabs-tabpane {
    height: 100%;
}

#coder-artifacts .output-html {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 680px;
  max-height: 1200px;
}

#coder-artifacts .output-html > iframe {
  flex: 1;
}

#coder-artifacts-code-drawer .output-code {
  flex:1;
}
#coder-artifacts-code-drawer .output-code .ms-gr-ant-spin-nested-loading {
  min-height: 100%;
}
"""

with gr.Blocks(css=css) as demo:
    # Global State
    state = gr.State({"system_prompt": "", "history": []})
    with ms.Application(elem_id="coder-artifacts") as app:
        with antd.ConfigProvider(theme=DEFAULT_THEME, locale=DEFAULT_LOCALE):

            with ms.AutoLoading():
                with antd.Row(gutter=[32, 12], elem_style=dict(marginTop=20), align="stretch"):
                    # Left Column
                    with antd.Col(span=24, md=8):
                        with antd.Flex(vertical=True, gap="middle", wrap=True):
                            with antd.Flex(justify="center", align="center", vertical=True, gap="middle"):
                                antd.Image(
                                    "https://img.alicdn.com/imgextra/i2/O1CN01KDhOma1DUo8oa7OIU_!!6000000000220-1-tps-240-240.gif",
                                    width=200,
                                    height=200,
                                    preview=False,
                                )
                                antd.Typography.Title(
                                    "Qwen3-Coder-WebDev",
                                    level=1,
                                    elem_style=dict(fontSize=24),
                                )
                            # Input
                            input = antd.Input.Textarea(
                                size="large",
                                allow_clear=True,
                                auto_size=dict(minRows=2, maxRows=6),
                                placeholder="Describe the web application you want to create",
                                elem_id="input-container",
                            )
                            # Input Notes
                            with antd.Flex(justify="space-between"):
                                antd.Typography.Text(
                                    "Note: The model supports multi-round dialogue, you can make the model generate interfaces by returning React or HTML code.",
                                    strong=True,
                                    type="warning",
                                )

                                tour_btn = antd.Button("Usage Tour", variant="filled", color="default")
                            # Submit Button
                            submit_btn = antd.Button(
                                "Submit", type="primary", block=True, size="large", elem_id="submit-btn"
                            )

                            antd.Divider("Settings")

                            # Settings Area
                            with antd.Space(size="small", wrap=True, elem_id="settings-area"):
                                history_btn = antd.Button("📜 History", type="default", elem_id="history-btn")
                                cleat_history_btn = antd.Button("🧹 Clear History", danger=True)

                            antd.Divider("Examples")

                            # Examples
                            with antd.Flex(gap="small", wrap=True):
                                for example in EXAMPLES:
                                    with antd.Card(elem_style=dict(flex="1 1 fit-content"), hoverable=True) as example_card:
                                        antd.Card.Meta(title=example['title'], description=example['description'])

                                    example_card.click(
                                        fn=GradioEvents.select_example(example),
                                        outputs=[input],
                                    )

                    # Right Column
                    with antd.Col(span=24, md=16):
                        with antd.Card(
                            title="Output",
                            elem_style=dict(height="100%", display="flex", flexDirection="column"),
                            styles=dict(body=dict(height=0, flex=1)),
                            elem_id="output-container",
                        ):
                            # Output Container Extra
                            with ms.Slot("extra"):
                                with ms.Div(elem_id="output-container-extra"):
                                    with antd.Button(
                                        "Download Code", type="link", href_target="_blank", disabled=True,
                                    ) as download_btn:
                                        with ms.Slot("icon"):
                                            antd.Icon("DownloadOutlined")
                                    download_content = gr.Text(visible=False)

                                    view_code_btn = antd.Button("🧑‍💻 View Code", type="primary")
                            # Output Content
                            with antd.Tabs(
                                elem_style=dict(height="100%"),
                                active_key="empty",
                                render_tab_bar="() => null",
                            ) as state_tab:
                                with antd.Tabs.Item(key="empty"):
                                    antd.Empty(
                                        description="Enter your request to generate code",
                                        elem_classes="output-empty",
                                    )
                                with antd.Tabs.Item(key="loading"):
                                    with antd.Spin(
                                        tip="Generating code...",
                                        size="large",
                                        elem_classes="output-loading",
                                    ):
                                        # placeholder
                                        ms.Div()
                                with antd.Tabs.Item(key="render"):
                                    sandbox = pro.WebSandbox(
                                        height="100%",
                                        elem_classes="output-html",
                                        template="html",
                                    )

                    # Modals and Drawers
                    with antd.Modal(open=False, title="System Prompt", width="800px") as system_prompt_modal:
                        system_prompt_input = antd.Input.Textarea(
                            # SYSTEM_PROMPT,
                            value="",
                            size="large",
                            placeholder="Enter your system prompt here",
                            allow_clear=True,
                            auto_size=dict(minRows=4, maxRows=14),
                        )

                    with antd.Drawer(
                        open=False,
                        title="Output Code",
                        placement="right",
                        get_container="() => document.querySelector('.gradio-container')",
                        elem_id="coder-artifacts-code-drawer",
                        styles=dict(body=dict(display="flex", flexDirection="column-reverse")),
                        width="750px",
                    ) as output_code_drawer:
                        with ms.Div(elem_classes="output-code"):
                            with antd.Spin(spinning=False) as output_loading:
                                output = ms.Markdown()

                    with antd.Drawer(
                        open=False,
                        title="Chat History",
                        placement="left",
                        get_container="() => document.querySelector('.gradio-container')",
                        width="750px",
                    ) as history_drawer:
                        history_output = gr.Chatbot(
                            show_label=False,
                            type="messages",
                            height='100%',
                            elem_classes="history_chatbot",
                        )
                    # Tour
                    with antd.Tour(open=False) as usage_tour:
                        antd.Tour.Step(
                            title="Step 1",
                            description="Describe the web application you want to create.",
                            get_target="() => document.querySelector('#input-container')",
                        )
                        antd.Tour.Step(
                            title="Step 2",
                            description="Click the submit button.",
                            get_target="() => document.querySelector('#submit-btn')",
                        )
                        antd.Tour.Step(
                            title="Step 3",
                            description="Wait for the result.",
                            get_target="() => document.querySelector('#output-container')",
                        )
                        antd.Tour.Step(
                            title="Step 4",
                            description="Download the generated HTML here or view the code.",
                            get_target="() => document.querySelector('#output-container-extra')",
                        )
                        antd.Tour.Step(
                            title="Additional Settings",
                            description="You can change chat history here.",
                            get_target="() => document.querySelector('#settings-area')",
                        )
    # Event Handler
    gr.on(fn=GradioEvents.close_modal, triggers=[usage_tour.close, usage_tour.finish], outputs=[usage_tour])
    tour_btn.click(fn=GradioEvents.open_modal, outputs=[usage_tour])

    # system_prompt_btn.click(fn=GradioEvents.open_modal,
    #                         outputs=[system_prompt_modal])

    system_prompt_modal.ok(GradioEvents.update_system_prompt,
                           inputs=[system_prompt_input, state],
                           outputs=[state]).then(fn=GradioEvents.close_modal,
                                                 outputs=[system_prompt_modal])

    system_prompt_modal.cancel(GradioEvents.close_modal,
                               outputs=[system_prompt_modal]).then(
                                   fn=GradioEvents.reset_system_prompt,
                                   inputs=[state],
                                   outputs=[system_prompt_input])
    output_code_drawer.close(fn=GradioEvents.close_modal, outputs=[output_code_drawer])
    cleat_history_btn.click(fn=GradioEvents.clear_history, inputs=[state], outputs=[state])
    history_btn.click(fn=GradioEvents.open_modal, outputs=[history_drawer]).then(
        fn=GradioEvents.render_history, inputs=[state], outputs=[history_output]
    )
    history_drawer.close(fn=GradioEvents.close_modal, outputs=[history_drawer])

    download_btn.click(
        fn=None,
        inputs=[download_content],
        js="""(content) => {
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'output.txt'
        a.click()
}""",
    )
    view_code_btn.click(fn=GradioEvents.open_modal, outputs=[output_code_drawer])
    submit_btn.click(
        fn=GradioEvents.open_modal,
        outputs=[output_code_drawer],
    ).then(
        fn=GradioEvents.disable_btns([submit_btn, download_btn]),
        outputs=[submit_btn, download_btn],
    ).then(
        fn=GradioEvents.generate_code,
        inputs=[input, system_prompt_input, state],
        outputs=[output, state_tab, sandbox, download_content, output_loading, state],
    ).then(
        fn=GradioEvents.enable_btns([submit_btn, download_btn]),
        outputs=[submit_btn, download_btn],
    ).then(
        fn=GradioEvents.close_modal,
        outputs=[output_code_drawer],
    )

if __name__ == "__main__":
    demo.queue(default_concurrency_limit=100, max_size=100).launch(ssr_mode=False, max_threads=100)
