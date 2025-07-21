/* Amplify Params - DO NOT EDIT
  API_TOGATHER_GRAPHQLAPIENDPOINTOUTPUT
  API_TOGATHER_GRAPHQLAPIIDOUTPUT
  API_TOGATHER_GRAPHQLAPIKEYOUTPUT
  ENV
  REGION
Amplify Params - DO NOT EDIT *//* Amplify Params - DO NOT EDIT
  API_TOGATHER_GRAPHQLAPIENDPOINTOUTPUT
  API_TOGATHER_GRAPHQLAPIIDOUTPUT
  API_TOGATHER_GRAPHQLAPIKEYOUTPUT
  ENV
  REGION
Amplify Params - DO NOT EDIT *//* Amplify Params - DO NOT EDIT
  API_TOGATHER_GRAPHQLAPIENDPOINTOUTPUT
  API_TOGATHER_GRAPHQLAPIIDOUTPUT
  API_TOGATHER_GRAPHQLAPIKEYOUTPUT
  ENV
  REGION
Amplify Params - DO NOT EDIT */
import crypto from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { default as fetch, Request } from 'node-fetch';
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { v4 as uuidv4 } from "uuid";
const { Sha256 } = crypto;
const appsyncUrl = process.env.API_TOGATHER_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const url = new URL(appsyncUrl);

const signer = new SignatureV4({
  credentials: defaultProvider(),
  region: AWS_REGION,
  service: 'appsync',
  sha256: Sha256
});
const verifier = CognitoJwtVerifier.create({
  userPoolId: "us-east-1_eQRQqZevD",
  tokenUse: "id",
  clientId: "76fhts9ggtn8lut3fadud392sb",
});
async function getUser(token) {
  try {
    const payload = await verifier.verify(token);
    console.log("Token is valid. Payload:", payload);
    return payload;
  } catch (err) {
    console.log("Token not valid!", err);
    return err;
  }
}

async function signedFetch(request) {
  const signedRequest = await signer.sign(request);
  const response = await fetch(appsyncUrl, signedRequest);
  return response.json();
}


const getEvent = `
        query getEvent($id: ID!) {
          getEvent(id: $id) {
            id
            name
            startDate
            startTime
            owner
            EventSettings {
              id
            }
            owners:Invitations {
              items {
                Attendees{
                  items {
                    is_host
                    is_owner
                    User {
                      id
                      email
                      firstName
                      lastName
                      phone
                    }
                  }
                }
              }
            }
            Invitations {
              items {
                id
                Attendees {
                  items {
                    id
                    User {
                      id
                    }
                  }
                }
              }
            }
            Tables {
              items {
                id
                Seats {
                  items {
                    id
                  }
                }
              }
            }
            Venue {
              id
              name
            }
            bannerImage {
              id
            }
            gallery {
              items {
                id
              }
            }
            host {
              items {
                id
              }
            }
          }
        }`;


/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const listNotificationTypes = `
    query listNotificationTypes(
              $filter: ModelNotificationTypeFilterInput
              $limit: Int)
              {
                listNotificationTypes( filter: $filter,limit:$limit){
                        items {
                          id
                          type
                          IsEmailRequired
                          EmailFileName
                          IsSmsRequired
                          SmsText
                          IsPushRequired
                          PushText
                        }
                      }
                    }
                  `;
const listNotificationsCounts = `query listNotificationsCounts(
                    $filter: ModelNotificationsCountFilterInput
                    $limit: Int)
                    {
                      listNotificationsCounts(filter: $filter,limit:$limit) {
                        items {
                          id
                          unreadMessageNumber
                        }
                      }
                    }`;

var updateNotificationsCount =
  `mutation updateNotificationsCount(
                        $input: UpdateNotificationsCountInput!   
                      ) {
                        updateNotificationsCount(input: $input) {
                          id
                        }
                      }`;
var createNotificationsCount =
  `mutation createNotificationsCount(
                          $input: CreateNotificationsCountInput!   
                        ) {
                          createNotificationsCount(input: $input) {
                            id
                          }
                        }`;
async function verifyUser(...param) {
  var eventID = param[0];
  var owner = param[1];
  var phone = param[2];
  const getEventbyId = {
    query: getEvent,
    operationName: 'getEvent',
    variables: {
      id: eventID,
    },
  }
  var eventdata = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    hostname: url.hostname,
    body: JSON.stringify(getEventbyId),
    path: url.pathname
  });
  const ownerDetails = await signedFetch(eventdata);
  var email = ownerDetails.data.getEvent || null;
  console.log(email, "email");
  var ownersAccess = [];
  var phoneNo = [];
  Promise.all(email?.owners?.items[0]?.Attendees?.items.map((user) => {
    ownersAccess.push(user?.User?.email);
    phoneNo.push(user?.User?.phone);
  }))
  console.log(email, "------------>Owner Details")
  var response = {
    status: "",
    notificationUsers: [],
    name: email.name,
    startDate: email.startDate,
    startTime: email.startTime
  };
  var notificationUsers = [];
  if (email != null) {
    response.status = (owner && ownersAccess.includes(owner)) || (phone && phoneNo.includes(phone)) ? "Access Granted" : "UnAuthorized"
    await Promise.all(email.owners.items[0].Attendees.items.map((user) => {
      if (user?.User?.email != owner) {
        notificationUsers.push(user.User);
      }
    }))
    response.notificationUsers = notificationUsers;
  }
  else {
    response.status = "Check EventId"
  }
  console.log(response, "----------->response")
  return response;
}
var updateEventInvitationQuery =
  `mutation updateEvent(
$input: UpdateEventInput!   
) {
  updateEvent(input: $input) {
id
}
}`;
const getUserByEmail = `
query listUsers(
  $filter: ModelUserFilterInput
  $limit: Int)
  {
  listUsers( filter: $filter,limit:$limit){
            items {
              id
              address
              email
              fullName
              firstName
              lastName
              phone
              createdAt
            }
          }
        }
      `;
export const handler = async (event) => {
  try {
    const {
      eventId,
      scripplePad, email, phone
    } = event.body ? JSON.parse(event.body) : {};
    console.log(event.headers.Authorization, "requestData")
    const Authorization = event?.headers?.Authorization?.toString()
    console.log(Authorization, "token");

    var payload;
    // var payload = await getUser(Authorization);

    if (Authorization) {
      console.log(Authorization, "token");
      payload = await getUser(Authorization);
    } else if (email || phone) {
      var eventfilter = [];
      if (email != "" && email != null) { eventfilter.push({ email: { eq: email.replace(/\s/g, "") } }) }
      if (phone != "" && phone != null) { eventfilter.push({ phone: { eq: phone.replace(/\s/g, "") } }) }
      console.log(eventfilter);
      var getUserById = {
        query: getUserByEmail,
        variables: {
          filter: { or: eventfilter },
          limit: 100000
        }
      };
      var user = new HttpRequest({
        hostname: url.hostname,
        path: url.pathname,
        body: JSON.stringify(getUserById),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: url.hostname,
        },
      });
      var userbyEmail = await signedFetch(user);
      console.log(userbyEmail, "userbyEmail");
      userbyEmail.data.listUsers.items = userbyEmail.data.listUsers?.items.length > 0 ? await userbyEmail.data.listUsers?.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
      var userId = userbyEmail.data.listUsers?.items.length > 0 ? userbyEmail.data.listUsers?.items[0].id : "";
      payload = {
        email: email ? email : "",
        phone: phone ? phone : "",
        given_name: userbyEmail.data.listUsers?.items[0].firstName || null,
        family_name: userbyEmail.data.listUsers?.items[0].lastName || null,
      }
      payload["custom:userId"] = userId
    }

    var owner = payload.email;
    var { status, notificationUsers, name, startDate, startTime } = await verifyUser(eventId, owner, phone);
    console.log(status)
    if (status == "Access Granted") {
      let eventDetails;
      eventDetails = {
        id: eventId,
        scripplePad: scripplePad,
        eventUserId: payload["custom:userId"],
        lastscripplePadUpdatedAt: new Date()
      }

      const updateEvent = {
        query: updateEventInvitationQuery,
        operationName: 'updateEvent',
        variables: {
          input: eventDetails,
        },
      }
      var updateEventData = new HttpRequest({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: url.hostname
        },
        hostname: url.hostname,
        body: JSON.stringify(updateEvent),
        path: url.pathname
      });
      const eventsData = await signedFetch(updateEventData);
      console.log(eventsData, "eventsData");

      const getNotificationType = {
        query: listNotificationTypes,
        variables: {
          filter: { type: { eq: "UPDATESCRIBBLEPAD" } },
          limit: 1
        }
      };
      const getNotificationTypeReq = new HttpRequest({
        hostname: url.hostname,
        path: url.pathname,
        body: JSON.stringify(getNotificationType),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: url.hostname,
        },
      });
      const getNotificationTypes = await signedFetch(getNotificationTypeReq);
      const notificationTypeId = getNotificationTypes.data.listNotificationTypes?.items[0];

      if (notificationTypeId) {
        const notifications = await Promise.all(notificationUsers.map(async (g) => {
          const message = notificationTypeId.SmsText.toString()
            .replace("$$user_name$$", `${payload.given_name} ${payload.family_name}`)
            .replace("$$event_name$$", name);
          const pushmessage = notificationTypeId.PushText.toString()
            .replace("$$user_name$$", `${payload.given_name} ${payload.family_name}`)
            .replace("$$event_name$$", name);

          const getNotifications = {
            query: listNotificationsCounts,
            variables: {
              filter: { userID: { eq: g.id } },
              limit: 1
            }
          };
          const getNotificationsRequest = new HttpRequest({
            hostname: url.hostname,
            path: url.pathname,
            body: JSON.stringify(getNotifications),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              host: url.hostname,
            },
          });
          const getNotificationsRequestUser = await signedFetch(getNotificationsRequest);
          const existingNotification = getNotificationsRequestUser.data.listNotificationsCounts?.items[0];

          if (existingNotification) {
            const message = {
              id: existingNotification.id,
              unreadMessageNumber: existingNotification.unreadMessageNumber + 1
            };
            const updateNotiNo = {
              query: updateNotificationsCount,
              operationName: 'updateNotificationsCount',
              variables: { input: message }
            };
            const updateNotificationsrequest = new HttpRequest({
              method: 'POST',
              headers: { 'Content-Type': 'application/json', host: url.hostname },
              hostname: url.hostname,
              body: JSON.stringify(updateNotiNo),
              path: url.pathname
            });
            await signedFetch(updateNotificationsrequest);
          } else {
            const message = {
              id: uuidv4(),
              userID: g.id,
              unreadMessageNumber: 1
            };
            const createNotiNo = {
              query: createNotificationsCount,
              operationName: 'createNotificationsCount',
              variables: { input: message }
            };
            const createNotificationsrequest = new HttpRequest({
              method: 'POST',
              headers: { 'Content-Type': 'application/json', host: url.hostname },
              hostname: url.hostname,
              body: JSON.stringify(createNotiNo),
              path: url.pathname
            });
            await signedFetch(createNotificationsrequest);
          }

          return {
            id: uuidv4(),
            notificationsEventId: eventId,
            notificationsUserId: g.id,
            notificationsNotificationTypeId: notificationTypeId.id,
            NotificationMessage: pushmessage,
            IsEmailDelivered: false,
            EmailNumberofAttempts: notificationTypeId.IsEmailRequired ? 0 : -1,
            EmailStatusMessage: "",
            IsPushDelivered: false,
            PushNumberofAttempts: notificationTypeId.IsPushRequired ? 0 : -1,
            PushStatusMessage: "",
            IsSMSDelivered: false,
            SmsNumberofAttempts: notificationTypeId.IsSmsRequired ? 0 : -1,
            SMSStatusMessage: "",
            SMSMessage: message,
            EventName: name,
            EventStartDate: startDate,
            EventStartTime: startTime,
            createdDate: new Date().toISOString().slice(0, 10)
          };
        }));

      console.log(notifications)
      await Promise.all(
        (notifications || []).map(async (g) => {
          var notification = {
            query: `mutation createNotifications(
            $input: CreateNotificationsInput!){
              createNotifications(input: $input){
                id
              }
            }
            `, operationName: 'createNotifications',
            variables: {
              input: g,
            }
          }
          var notificationRequest = new HttpRequest({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              host: url.hostname
            },
            hostname: url.hostname,
            body: JSON.stringify(notification),
            path: url.pathname
          });
          var notificationsssss = await signedFetch(notificationRequest);
          console.log(notificationsssss, "notificationsss");
          // if (response_status != false) {
          //   response_status = notificationsss.data == null ? false : true;
          // }
        }
        )
      );

      return {
        statusCode: 200,
        body: JSON.stringify("Scripple Added Succesfully"),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
      }
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify(status),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
      };
    }
  } catch (err) {
    console.log("error posting to appsync: ", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
      body: JSON.stringify(err),
    }
  }

};