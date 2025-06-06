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
Amplify Params - DO NOT EDIT */

import crypto from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { default as fetch, Request } from 'node-fetch';
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { v4 as uuidv4 } from "uuid";
import moment from 'moment-timezone';
import { DateTime } from "luxon";
import axios from "axios";
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const { Sha256 } = crypto;
const appsyncUrl = process.env.API_TOGATHER_GRAPHQLAPIENDPOINTOUTPUT;
const url = new URL(appsyncUrl);
const verifier = CognitoJwtVerifier.create({
  userPoolId: "us-east-1_eQRQqZevD",
  tokenUse: "id",
  clientId: "76fhts9ggtn8lut3fadud392sb",
});
const signer = new SignatureV4({
  credentials: defaultProvider(),
  region: AWS_REGION,
  service: 'appsync',
  sha256: Sha256
});
async function getUser(token) {
  return new Promise(async function (resolve, reject) {
    try {
      const payload = await verifier.verify(
        token
      );
      console.log("Token is valid. Payload:", payload);
      resolve(payload);
    } catch (err) {
      console.log("Token not valid!", err);
      resolve(err)
    }
  })
}
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
async function addHttpRequest(httpRequest) {
  return signer.sign(httpRequest);
}

const createEventGuestDetailss = `mutation createEventGuestDetails(
  $input: CreateEventGuestDetailsInput!
) {
  createEventGuestDetails(input: $input) {
    id
  }
}`;

const InvitationStatus = {
  DECLINED: "DECLINED",
  ACCEPTED: "ACCEPTED",
  PENDING: "PENDING",
};


import https from 'https';

async function initfetch(appsyncUrl, headers, body, method) {
  const agent = new https.Agent({
    keepAlive: true,  // Reuse connections for better performance
  });

  return new Promise(async function (resolve, reject) {
    try {
      const response = await fetch(appsyncUrl, {
        headers,
        body,
        method,
        agent, // Add agent here
      });
      resolve(await response.json());
    } catch (error) {
      reject(error);
    }
  });
}


const getEvent = `
      query getEvent($id: ID!) {
        getEvent(id: $id) {
          id
          name
          owner
          startDate
          startTime
          category
          adultsCost
          kidsCost
          eventTimeZone
          paymentType
          endTime
          endDate
          setGuestLimit
          isLocationRequired
          guestLimitCount
          TotalGuest:Invitations {
           items {
            Attendees(filter: {or: [{status: {eq: ACCEPTED}},{status:{eq:MAYBE}}]}) {
             items {
              id
              adultsCount
              kidsCount
              }
            }
          }
          }
          owners:Invitations {
            items {
              Attendees{
                items {
                  is_host
                  is_owner
                  status
                  adultsCount
                  kidsCount
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
              invitationsAccepted
              invitationsTotal
              invitationsDeclined
              invitationsRemaining
              Attendees {
                items {
                  id
                  status
                  adultsCount
                  kidsCount
                  totalPaidAmount
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
        }
      }
    `;
var updateAttendeeQuery =
  `mutation updateAttendee(
    $input: UpdateAttendeeInput!   
  ) {
    updateAttendee(input: $input) {
      id
    }
  }`;
var updateEventInvitationQuery =
  `mutation updateEventInvitations(
  $input: UpdateEventInvitationsInput!   
) {
  updateEventInvitations(input: $input) {
    id
  }
}`;
function hasEnded(endDate, endTime, timezone) {
  // Combine date and time strings and create moment object in the provided timezone
  const endDateTime = moment.tz(`${endDate}T${endTime}`, 'YYYY-MM-DD HH:mm:ss.SSSS', timezone);

  // Get the current time in the provided timezone
  const currentTime = moment.tz(timezone);

  // Check if the endDateTime is before the current time (i.e., the event has ended)
  const hasEnded = endDateTime.isBefore(currentTime);

  return hasEnded;
}

const getUserEventByEmail = `
      query listUserEventDetails(
        $filter: ModelUserEventDetailsFilterInput
        $limit: Int)
        {
          listUserEventDetails( filter: $filter,limit:$limit){
                  items {
                    id
                    eventCount
                    invitationCount
                    email
                    phone
                  }
                }
              }
            `;
async function updateUserEventDetails(attendeeMail, phone) {
  const eventfilter = [
    { email: { eq: attendeeMail } },
    ...(phone ? [{ phone: { eq: phone } }] : [])
  ];

  const getUserById = {
    query: getUserEventByEmail,
    variables: {
      filter: { or: eventfilter },
      limit: 100000
    }
  };

  const user = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(getUserById),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    }
  });

  const { headers, body, method } = await addHttpRequest(user);
  const userbyEmail = await initfetch(appsyncUrl, headers, body, method);
  const existingUser = userbyEmail.data.listUserEventDetails?.items[0];

  if (!existingUser) {
    // Create new user event details
    const userEvent = {
      id: uuidv4(),
      email: attendeeMail,
      phone: phone,
      eventCount: 0,
      invitationCount: 1
    };

    const createUserEvent = {
      query: `
                      mutation createUserEventDetails($input: CreateUserEventDetailsInput!) {
                        createUserEventDetails(input: $input) { id }
                      }
                    `,
      operationName: 'createUserEventDetails',
      variables: { input: userEvent }
    };

    const userEventRequest = new HttpRequest({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: url.hostname
      },
      hostname: url.hostname,
      body: JSON.stringify(createUserEvent),
      path: url.pathname
    });

    const { headers, body, method } = await addHttpRequest(userEventRequest);
    await initfetch(appsyncUrl, headers, body, method);
  } else {
    // Update existing user event details
    const userEvent = {
      id: existingUser.id,
      invitationCount: existingUser.invitationCount + 1
    };

    const updateUserEvent = {
      query: `
                      mutation updateUserEventDetails($input: UpdateUserEventDetailsInput!) {
                        updateUserEventDetails(input: $input) { id }
                      }
                    `,
      operationName: 'updateUserEventDetails',
      variables: { input: userEvent }
    };

    const updateUserEventRequest = new HttpRequest({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: url.hostname
      },
      hostname: url.hostname,
      body: JSON.stringify(updateUserEvent),
      path: url.pathname
    });

    const { headers, body, method } = await addHttpRequest(updateUserEventRequest);
    await initfetch(appsyncUrl, headers, body, method);
  }
}
async function createEventGuestDetails(event, attendeeMail, phone, userId) {
  const dateTimeString = `${event.startDate}T${event.startTime}`;
  const eventStart = DateTime.fromISO(dateTimeString, { zone: event.eventTimeZone });
  const eventStartUTC = eventStart.toUTC();

  const eventGuestDetails = {
    id: uuidv4(),
    email: attendeeMail,
    phone: phone,
    eventID: event.id,
    is_host: false,
    is_owner: false,
    userID: userId,
    is_delete: 0,
    isHost: 0,
    eventGuestDetailsEventId: event.id,
    userIdAndisHostAndIsDelete: `${userId}#0#0`,
    eventDateTime: eventStartUTC.toISO()
  };

  const createUserGuest = {
    query: createEventGuestDetailss,
    operationName: 'createEventGuestDetails',
    variables: { input: eventGuestDetails }
  };

  const userGuestRequest = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    hostname: url.hostname,
    body: JSON.stringify(createUserGuest),
    path: url.pathname
  });

  const { headers, body, method } = await addHttpRequest(userGuestRequest);
  await initfetch(appsyncUrl, headers, body, method);
}

async function getEventDetails(eventId) {
  const getEventbyId = {
    query: getEvent,
    operationName: 'getEvent',
    variables: { id: eventId }
  };

  const eventdata = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    hostname: url.hostname,
    body: JSON.stringify(getEventbyId),
    path: url.pathname
  });

  const { headers, body, method } = await addHttpRequest(eventdata);
  const data = await initfetch(appsyncUrl, headers, body, method);
  return data.data.getEvent;
}
function calculateTotalAttendees(event, adultsCount, kidsCount) {
  const gusts = event.TotalGuest.items[0].Attendees.items;
  const totalAdultsCount = gusts.reduce((sum, val) => sum + val.adultsCount, 0);
  const totalKidsCount = gusts.reduce((sum, val) => sum + val.kidsCount, 0);
  return totalAdultsCount + totalKidsCount + adultsCount + kidsCount;
}

async function processRSVP(event, attendeeMail, userId, phone, comment) {
  const allguests = event.owners.items[0].Attendees.items
    .map(user => user?.User?.email)
    .filter(Boolean);

  if (!allguests.includes(attendeeMail)) {
    // Create new attendee
    const attendee = {
      id: uuidv4(),
      attendeeUserId: userId,
      eventinvitationsID: event.Invitations.items[0].id,
      status: InvitationStatus.PENDING,
      is_host: false,
      is_owner: false,
      eventID: "null",
      adultsCount: 1,
      kidsCount: 0,
      comment: comment || null,
      paymentStatus: false
    };

    const createAttendee = {
      query: `
          mutation createAttendee($input: CreateAttendeeInput!) {
            createAttendee(input: $input) {
              id
              status
              eventinvitationsID
              created
              lastModified
              createdAt
              updatedAt
              Seat {
                id
                tableID
                createdAt
                updatedAt
              }
              User {
                id
                firstName
                lastName
                email
                phone
                createdAt
                updatedAt
              }
            }
          }
        `,
      operationName: 'createAttendee',
      variables: { input: attendee }
    };

    const attendeerequest = new HttpRequest({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: url.hostname
      },
      hostname: url.hostname,
      body: JSON.stringify(createAttendee),
      path: url.pathname
    });

    const { headers, body, method } = await addHttpRequest(attendeerequest);
    const attendees = await initfetch(appsyncUrl, headers, body, method);
    event.Invitations.items[0].Attendees?.items.push(attendees?.data?.createAttendee);

    // Create event guest details and Update user event details in parallel
    await Promise.all([
        createEventGuestDetails(event, attendeeMail, phone, userId),
        updateUserEventDetails(attendeeMail, phone)
    ]);
  }
}
function getHosts(event) {
  return event.owners.items[0].Attendees.items
    .filter(user => user?.is_host || user?.is_owner)
    .map(user => user?.User);
}

// Helper function to get attendee ID
function getAttendeeId(event, attendeeMail) {
  const attendee = event.Invitations.items[0].Attendees?.items
    .find(attendee => attendee?.User?.email === attendeeMail);
  return attendee?.id;
}

// Helper function to get attendee status
function getAttendeeStatus(event, attendeeMail) {
  const attendee = event.Invitations.items[0].Attendees?.items
    .find(attendee => attendee?.User?.email === attendeeMail);
  return attendee?.status;
}
async function verifyUser(eventId, attendeeMail, type, userId, phone, attendeeStatus, comment, adultsCount, kidsCount) {
  const event = await getEventDetails(eventId);
  if (!event) {
    return { status: "Check EventId" };
  }

  // Check owner access
  if (event.owner === attendeeMail) {
    return { status: "You are owner of the event you cannot update RSVP" };
  }

  // Check event end
  const eventHasEnded = await hasEnded(event.endDate, event.endTime, event.eventTimeZone);
  if (type === "RSVP" && eventHasEnded) {
    return { status: `This ${event.name} event is ended` };
  }

  // Check guest limit
  const totalAttendees = calculateTotalAttendees(event, adultsCount, kidsCount);
  if (event.setGuestLimit && event.guestLimitCount < totalAttendees &&
    attendeeStatus !== "PENDING" && attendeeStatus !== "DECLINED") {
    return { status: `This ${event.name} event reached guest limit` };
  }

  // Process RSVP
  if (type === "RSVP") {
    await processRSVP(event, attendeeMail, userId, phone, comment);
  }

  return {
    status: "Access Granted",
    name: event.name,
    startDate: event.startDate,
    startTime: event.startTime,
    hosts: [],
    attendeeId: getAttendeeId(event, attendeeMail),
    eventinvitationsID: event.Invitations.items[0].id,
    invitationsTotal: event.Invitations.items[0].invitationsTotal,
    invitationsAccepted: event.Invitations.items[0].invitationsAccepted,
    invitationsDeclined: event.Invitations.items[0].invitationsDeclined,
    invitationsRemaining: event.Invitations.items[0].invitationsRemaining,
    atStatus: getAttendeeStatus(event, attendeeMail),
    userId: userId,
    category: event.category,
    paymentType: event.paymentType
  };
}

async function updatePaymentStatus(...param) {
  var eventID = param[0];
  var attendeeMail = param[1];
  var type = param[2];

  // Prepare HttpRequests for parallel execution
  const getEventbyIdPayload = {
    query: getEvent,
    operationName: 'getEvent',
    variables: {
      id: eventID,
    },
  };
  const eventdataRequest = new HttpRequest({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', host: url.hostname },
    hostname: url.hostname,
    body: JSON.stringify(getEventbyIdPayload),
    path: url.pathname
  });

  // Note: The following section related to updatePaymentStatus is part of the main handler,
  // not the updatePaymentStatus function itself.
  // The task is to optimize updatePaymentStatus.
  // The initial fetch for getEvent within updatePaymentStatus is what we're parallelizing here.
  // The getNotificationType fetch is within the 'if (status == "Access Granted")' block further down.

  // Placeholder for where getNotificationTypeReq would be prepared if it were at this top level
  // For now, we only parallelize what's available at the start of the function.

  const [eventDataSigned] = await Promise.all([
    addHttpRequest(eventdataRequest),
    // addHttpRequest(getNotificationTypeReq) // If getNotificationTypeReq were here
  ]);

  const [eventDataResult] = await Promise.all([
    initfetch(appsyncUrl, eventDataSigned.headers, eventDataSigned.body, eventDataSigned.method),
    // initfetch(appsyncUrl, notificationTypeSigned.headers, notificationTypeSigned.body, notificationTypeSigned.method) // If it were here
  ]);

  console.log(eventDataResult, "------------>data Details")
  var email = eventDataResult.data.getEvent || null;
  console.log(email, "------------->Owner Details")
  // var notificationTypeId = getNotificationTypesResult.data.listNotificationTypes?.items.length > 0 ? getNotificationTypesResult.data.listNotificationTypes?.items[0] : "";


  var ownersAccess = [];
  var hostId = "";
  var totalPaidAmount = 0;
  email.owners.items[0].Attendees.items.forEach((user) => {
    if (user?.is_host == true || user?.is_owner == true) {
      hostId = user?.User?.id;
    }
  })

  const eventHasEnded = await hasEnded(email?.endDate, email?.endTime, email?.eventTimeZone);
  if (type == "RSVP" && eventHasEnded == true) {
    var response = {
      status: " This " + email.name + " event is ended"
    }
    return response;
  }
  var response = {
    status: "",
    name: email.name,
    startDate: email.startDate,
    startTime: email.startTime,
    hostId: hostId,
    attendeeId: "",
    eventinvitationsID: "",
    invitationsTotal: 0,
    invitationsAccepted: 0,
    invitationsDeclined: 0,
    invitationsRemaining: 0,
    atStatus: "",
    userId: "",
    attenName: "",
    totalPaidAmount: 0
  };
  if (email != null) {
    var attendees = email.Invitations.items[0].Attendees?.items || [];
    if (attendees.length > 0) {
      attendees.forEach((attendee) => {
        console.log(attendee, "attendee")
        if (attendee?.User?.email == attendeeMail) {
          response.status = "Access Granted";
          response.attenName = attendee?.User?.firstName + " " + (attendee?.User?.lastName || '')
          response.attendeeId = attendee.id;
          response.userId = attendee.User.id;
          response.totalPaidAmount = attendee?.totalPaidAmount < (attendee.adultsCount * email.adultsCost) + (attendee.kidsCount * email.kidsCost) ? (attendee.adultsCount * email.adultsCost) + (attendee.kidsCount * email.kidsCost) : attendee?.totalPaidAmount;
          response.eventinvitationsID = response.status == "Access Granted" ? email.Invitations.items[0].id : ""
          response.invitationsTotal = response.status == "Access Granted" ? email.Invitations.items[0].invitationsTotal : 0
          response.invitationsAccepted = response.status == "Access Granted" ? email.Invitations.items[0].invitationsAccepted : 0
          response.invitationsDeclined = response.status == "Access Granted" ? email.Invitations.items[0].invitationsDeclined : 0
          response.invitationsRemaining = response.status == "Access Granted" ? email.Invitations.items[0].invitationsRemaining : 0
          response.atStatus = response.status == "Access Granted" ? attendee.status : ""
        }
      });
      response.status = response.status == "Access Granted" ? response.status : "UnAuthorized"
    } else {
      response.status = "UnAuthorized";
    }
  }
  else {
    response.status = "Check EventId";
  }
  return response;
}

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

var createAttendeesSeat =
  `mutation createAttendeesSeat(
            $input: CreateAttendeesSeatInput!   
          ) {
            createAttendeesSeat(input: $input) {
              id
            }
          }`;

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

const listSeats = `
              query listSeats(
                        $filter: ModelSeatFilterInput
                        $limit: Int)
                        {
                          listSeats( filter: $filter,limit:$limit){
                                  items {
                                    id
                                  }
                                }
                              }
                            `;


const listAttendeesSeats = `
              query listAttendeesSeats(
                        $filter: ModelAttendeesSeatFilterInput
                        $limit: Int)
                        {
                          listAttendeesSeats(filter: $filter,limit:$limit){
                                  items {
                                    id
                                  }
                                }
                              }
                            `;
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
var updateSeatQuery = `
mutation updateSeat(
$input: UpdateSeatInput!
) { 
updateSeat(input: $input) {
  id
  tableID
  createdAt
  updatedAt
}
}
`;

const updateUser = `mutation updateUser(
  $input: UpdateUserInput!
) {
  updateUser(input: $input) {
    id
    firstName
    lastName
    email
    phone
    createdAt
    updatedAt 
   }
  }`;
const deleteAttendeesSeat =
  `mutation deleteAttendeesSeat(
$input: DeleteAttendeesSeatInput!   
) {
  deleteAttendeesSeat(input: $input) {
id
}
}`;

const deleteNotifications = `
  mutation deleteNotifications(
    $input: DeleteNotificationsInput!
  ) {
    deleteNotifications(input: $input) {
      id
    }
  }
`;

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

const getNotificationQuery = `query listNotifications(
      $filter: ModelNotificationsFilterInput
      $limit: Int
      $nextToken: String){
        listNotifications(filter: $filter,limit: $limit,nextToken:$nextToken){
        items {
          id
          notificationsEventId
          notificationsUserId
          notificationsNotificationTypeId
          NotificationMessage
          IsPushDelivered
          PushNumberofAttempts
          PushStatusMessage
          IsSMSDelivered
          SmsNumberofAttempts
          SMSStatusMessage
          SMSMessage
          IsEmailDelivered
          EmailNumberofAttempts
          EmailStatusMessage
          User {
            id
            email
            phone
            fullName
            is_register
          }
          Event {
            id
            startDate
            startTime
            endDate
            endTime
            name
            eventTimeZone
            hostName
            welcomeMessage
            welcomeImage
            welcomeVideo
            thankyouMessage
            thankyouImage
            thankyouVideo
            Invitations {
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
                      fullName
                    }
                  }
                }
              }
            }
            Venue {
              id
              name
            }
          }
          NotificationType{
            id
            type
            IsEmailRequired
            EmailFileName
            EmailSubject
            IsSmsRequired
            SmsText
            IsPushRequired
            PushText
          }
        }
          nextToken
      }
    }`;

const updateNotificationsQuery = `mutation updateNotifications(
      $input: UpdateNotificationsInput!   
    ) {
      updateNotifications(input: $input) {
        id 
      }
    }`;



async function updateNotifi(userId) {
  var getNotificationType = {
    query: listNotificationTypes,
    variables: {
      filter: { type: { eq: "Payment" } },
      limit: 100000
    }
  }
  var getNotificationTypeReq = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(getNotificationType),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname,
    },
  });
  var { headers, body, method } = await addHttpRequest(getNotificationTypeReq)
  var getNotificationTypes = await initfetch(appsyncUrl, headers, body, method);
  var notificationTypeId = getNotificationTypes.data.listNotificationTypes?.items.length > 0 ? getNotificationTypes.data.listNotificationTypes?.items[0] : "";
  console.log(notificationTypeId, userId, notificationTypeId.id, "qqqqqqnotificationTypeId");
  if (notificationTypeId != "") {
    var token = null;
    var notificationList = [];
    for (var tok = 1; tok != 0;) {
      const getNotificationList = {
        query: getNotificationQuery,
        variables: {
          filter: { and: { notificationsUserId: { eq: userId }, notificationsNotificationTypeId: { eq: notificationTypeId.id } } },
          limit: 1000000,
          nextToken: token
        }
      }
      const getNotificationListReq = new HttpRequest({
        hostname: url.hostname,
        path: url.pathname,
        body: JSON.stringify(getNotificationList),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: url.hostname,
        },
      });
      var { headers, body, method } = await addHttpRequest(getNotificationListReq)
      var allPaymentNotification = await initfetch(appsyncUrl, headers, body, method);
      console.log(allPaymentNotification, "allPaymentNotification");
      token = allPaymentNotification?.data?.listNotifications?.nextToken;
      notificationList.push(...allPaymentNotification?.data?.listNotifications?.items)
      if (token != null) {
        tok++
      } else {
        tok = 0;
      }
    }
    console.log(notificationList, "allPaymentNotification")
    if (notificationList.length > 0) {
      console.log(`Starting parallel deletion of ${notificationList.length} notifications.`);
      await Promise.all(notificationList.map(async (notificationItem) => {
        const deleteNotificationsId = { id: notificationItem.id };
        const deleteNotificationsUsingId = {
          query: deleteNotifications, // Assuming 'deleteNotifications' is the GraphQL mutation string
          operationName: 'deleteNotifications',
          variables: {
            input: deleteNotificationsId,
          },
        };
        const deleteNotificationsRequest = new HttpRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', host: url.hostname },
          hostname: url.hostname,
          body: JSON.stringify(deleteNotificationsUsingId),
          path: url.pathname
        });
        const signedRequest = await addHttpRequest(deleteNotificationsRequest);
        // Return the promise from initfetch
        return initfetch(appsyncUrl, signedRequest.headers, signedRequest.body, signedRequest.method); 
      }));
      console.log("Finished parallel deletion of notifications.");
    }
  }
}
async function updateNotifi_accept(userId, name, eventId, startDate, startTime) {

  var getNotificationType = {
    query: listNotificationTypes,
    variables: {
      filter: { type: { eq: "Payment" } },
      limit: 100000
    }
  }
  var getNotificationTypeReq = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(getNotificationType),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname,
    },
  });
  // The getNotificationType logic is further down, this part of the diff is for context
  // but the actual parallelization of getNotificationType will be handled where it's defined.
  // This is a bit tricky because the original code fetches getNotificationType later.
  // We will address the parallelization of getNotificationType where it occurs.

  // ... (code between event fetch and notification type fetch) ...

  // The actual getNotificationType fetch is here, inside the if (status == "Access Granted") block
  // It's not possible to parallelize it with the initial getEvent at the top of the function
  // without significant restructuring, as it depends on `status == "Access Granted"`.
  // The request was to parallelize if their HttpRequest objects can be prepared independently.
  // At the very top level of `updatePaymentStatus`, only `getEvent`'s HttpRequest is prepared.

  // However, the `listNotificationTypes` call within the `if (status == "Access Granted")` block
  // (which is part of the main `handler` function, not `updatePaymentStatus`)
  // is independent of the `updateAttendee` call that precedes it.

  // Let's focus on the `notificationss.forEach` for now as that's clearly in `updatePaymentStatus` indirectly via the main handler.
  // The `updatePaymentStatus` function itself doesn't have the `notificationss.forEach` loop.
  // That loop is in the main `handler` function.

  // Re-evaluating the task: "Optimize the updatePaymentStatus function in 1.js"
  // and "Change the notification creation loop from notificationss.forEach(async ...)"
  // The `notificationss.forEach` is in the main `handler`, not `updatePaymentStatus`.
  // The `updatePaymentStatus` function itself *returns* data that is then used by the main handler.

  // Let's stick to what's *inside* `updatePaymentStatus` for now.
  // The initial `getEvent` is the primary async call at the start of `updatePaymentStatus`.
  // There isn't another independent AppSync call *at the beginning* of `updatePaymentStatus` to parallelize with it.

  // The task also mentions:
  // "Later, it fetches notification types: var getNotificationTypes = await initfetch(...);"
  // "Then, it fetches a list of notifications: var allPaymentNotification = await initfetch(...);"
  // These are within the `handler` function, in the `if (paymentStatus != null && paymentStatus != undefined)` block,
  // *after* `updatePaymentStatus` is called.

  // Let's correct the `notificationss.forEach` in the main `handler` as that was a specific request.
  // And clarify that the `getEvent` in `updatePaymentStatus` doesn't have an immediate parallel partner *within that function*.

  // The following change is for the `handler` function, not `updatePaymentStatus` directly.
  // This addresses the `notificationss.forEach` part of the request.
  // The `getNotificationType` and `allPaymentNotification` are also in the handler.

  // The structure of the diff needs to target the correct function.
  // The initial changes for `updatePaymentStatus` for `getEvent` are above.
  // Now, for the `notificationss.forEach` which is in the `handler` function:
  // This part of the diff will be messy because the context is large.
  // I will create a separate diff for the `handler` function for the `notificationss.forEach`.

  // For `updatePaymentStatus` itself, the only optimization was the attempted parallelization of `getEvent`.
  // Since there's no other independent call *at its beginning*, Promise.all with one item isn't a change.
  // The original code for `getEvent` in `updatePaymentStatus` is fine as a single sequential call.

  // Let's revert the `updatePaymentStatus` change for `getEvent` as it added complexity without parallelism there,
  // and then address the `notificationss.forEach` in the `handler`.

  // The `getNotificationType` fetch in the `handler` (after `updatePaymentStatus` is called):
  var { headers: notificationTypeHeaders, body: notificationTypeBody, method: notificationTypeMethod } = await addHttpRequest(getNotificationTypeReq)
  var getNotificationTypes = await initfetch(appsyncUrl, notificationTypeHeaders, notificationTypeBody, notificationTypeMethod);
  var notificationTypeId = getNotificationTypes.data.listNotificationTypes?.items.length > 0 ? getNotificationTypes.data.listNotificationTypes?.items[0] : "";
  console.log(notificationTypeId, "qqqqqqnotificationTypeId");
  if (notificationTypeId != "") {
    const currentDate = new Date(); // Current date
    currentDate.setDate(currentDate.getDate() + 1); // Add 4 days
    const newDate = currentDate.toISOString().slice(0, 10);
    var g = {
      id: uuidv4(),
      notificationsEventId: eventId,
      notificationsUserId: userId,
      notificationsNotificationTypeId: notificationTypeId.id,
      NotificationMessage: `"Your payment for ${name} is still unpaid."`,
      IsEmailDelivered: false,
      EmailNumberofAttempts: 1,
      EmailStatusMessage: "",
      IsPushDelivered: false,
      PushNumberofAttempts: notificationTypeId.IsPushRequired == true ? 0 : -1,
      PushStatusMessage: "",
      IsSMSDelivered: false,
      SmsNumberofAttempts: notificationTypeId.IsSmsRequired == true ? 0 : -1,
      SMSStatusMessage: "",
      SMSMessage: `"Your payment for ${name} is still unpaid."`,
      EventName: name,
      EventStartDate: startDate,
      EventStartTime: startTime,
      createdDate: newDate
    };

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
    var { headers, body, method } = await addHttpRequest(notificationRequest)
    var notificationsssss = await initfetch(appsyncUrl, headers, body, method);
    console.log(notificationsssss, "notificationsss");
  }

}
async function updateNotificationStatus(message) {

  console.log("updateNotificationStatus--->message", message);
  const updateNotiNo = {
    query: updateNotificationsQuery, operationName: 'updateNotifications',
    variables: {
      input: message,
    }
  };
  var updateNotificationsrequest = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    hostname: url.hostname,
    body: JSON.stringify(updateNotiNo),
    path: url.pathname
  });
  var { headers, body, method } = await addHttpRequest(updateNotificationsrequest)
  var updateNotifica = await initfetch(appsyncUrl, headers, body, method);
  console.log("updateNotificationStatus", updateNotifica);
}

async function executeGraphQL(query, variables) {
  const request = {
    query,
    variables
  };

  const httpRequest = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(request),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    }
  });

  const { headers, body, method } = await addHttpRequest(httpRequest);
  return initfetch(appsyncUrl, headers, body, method);
}
async function getExistingSeats(attendeeId) {
  const [attendeeSeats, seats] = await Promise.all([
    executeGraphQL(listAttendeesSeats, {
      filter: { attendeesSeatAttendeeId: { eq: attendeeId } },
      limit: 100000
    }),
    executeGraphQL(listSeats, {
      filter: { seatAttendeeId: { eq: attendeeId } },
      limit: 100000
    })
  ]);

  return {
    attendeeSeats: attendeeSeats.data.listAttendeesSeats?.items || [],
    seats: seats.data.listSeats?.items || []
  };
}

async function deleteAttendeeSeat(seatId) {
  const deleteSeat = {
    query: deleteAttendeesSeat,
    operationName: 'deleteAttendeesSeat',
    variables: {
      input: { id: seatId }
    }
  };

  const request = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    hostname: url.hostname,
    body: JSON.stringify(deleteSeat),
    path: url.pathname
  });

  const { headers, body, method } = await addHttpRequest(request);
  return initfetch(appsyncUrl, headers, body, method);
}
async function updateSeat(seatId) {
  const updateSeatInput = {
    query: updateSeatQuery,
    operationName: 'updateSeat',
    variables: {
      input: {
        id: seatId,
        seatAttendeeId: null
      }
    }
  };

  const request = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    hostname: url.hostname,
    body: JSON.stringify(updateSeatInput),
    path: url.pathname
  });

  const { headers, body, method } = await addHttpRequest(request);
  return initfetch(appsyncUrl, headers, body, method);
}
async function createAttendeeSeat(seatData) {
  const createSeat = {
    query: createAttendeesSeat,
    operationName: 'createAttendeesSeat',
    variables: {
      input: seatData
    }
  };

  const request = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname
    },
    hostname: url.hostname,
    body: JSON.stringify(createSeat),
    path: url.pathname
  });

  const { headers, body, method } = await addHttpRequest(request);
  return initfetch(appsyncUrl, headers, body, method);
}

async function handleSeats(attendeeId, eventId, adultsCount, kidsCount, attendeeStatus) {
  if (attendeeStatus === "PENDING" || attendeeStatus === "DECLINED") return;

  // Delete existing seats in parallel
  const existingSeats = await getExistingSeats(attendeeId);
  await Promise.all([
    ...existingSeats.attendeeSeats.map(seat => deleteAttendeeSeat(seat.id)),
    ...existingSeats.seats.map(seat => updateSeat(seat.id))
  ]);

  // Create new seats in parallel
  const seats = [];
  if (adultsCount) {
    seats.push(...Array(adultsCount).fill().map((_, i) => ({
      type: "Adult",
      typeSequence: i + 1
    })));
  }
  if (kidsCount) {
    seats.push(...Array(kidsCount).fill().map((_, i) => ({
      type: "Kid",
      typeSequence: i + 1
    })));
  }

  return Promise.all(seats.map(seat =>
    createAttendeeSeat({
      ...seat,
      id: uuidv4(),
      attendeesSeatAttendeeId: attendeeId,
      eventID: eventId,
      attendeesSeatSeatId: null
    })
  ));
}

export const handler = async (event) => {
  try {
    const {
      eventId, attendeeStatus, adultsCount, kidsCount, type, firstName, lastName, email, comment, address, paymentStatus
    } = event.body ? JSON.parse(event.body) : {};
    console.log(event?.headers?.Authorization, "requestData");
    console.log(event?.headers?.Authorization, "requestData");

    const Authorization = event?.headers?.Authorization?.toString()
    var payload
    if (Authorization) {
      console.log(Authorization, "token");
      payload = await getUser(Authorization);
    } else if (firstName && lastName && email) {
      var eventfilter = [];
      email != "" && email != null ? eventfilter.push({ email: { eq: email.replace(/\s/g, "") } }) : "";
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
      var { headers, body, method } = await addHttpRequest(user);
      var userbyEmail;
      try {
        userbyEmail = await initfetch(appsyncUrl, headers, body, method);
        if (userbyEmail.errors) {
          console.error("GraphQL error fetching user by email:", userbyEmail.errors);
          return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error fetching user data by email.", details: userbyEmail.errors }),
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json",
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
          };
        }
      } catch (err) {
        console.error("Network or unexpected error fetching user by email:", err);
        return {
          statusCode: 500,
          body: JSON.stringify({ message: "Failed to query user information by email." }),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
          },
        };
      }
      console.log(userbyEmail, "userbyEmail");
      // Corrected: Removed unnecessary await from synchronous sort operation
      userbyEmail.data.listUsers.items = userbyEmail.data.listUsers?.items.length > 0 ? userbyEmail.data.listUsers?.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
      const existingUser = userbyEmail.data.listUsers?.items.length > 0 ? userbyEmail.data.listUsers.items[0] : null;

      if (!existingUser) {
        const newUserId = uuidv4();
        const userData = {
          id: newUserId,
          firstName: firstName,
          lastName: lastName,
          fullName: `${firstName} ${lastName}`.trim() || null,
          email: email.replace(/\s/g, "") || null,
          phone: null,
          profilePhoto: null,
          address: address || null,
          is_register: 1
        };
        const createUserMutation = {
          query: `
            mutation createUser($input: CreateUserInput!) {
              createUser(input: $input) {
                id
                firstName
                lastName
              }
            }
          `,
          operationName: 'createUser',
          variables: {
            input: userData,
          }
        };
        const userRequest = new HttpRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', host: url.hostname },
          hostname: url.hostname,
          body: JSON.stringify(createUserMutation),
          path: url.pathname
        });
        const { headers, body, method } = await addHttpRequest(userRequest);
        var createUserResult;
        try {
          createUserResult =  initfetch(appsyncUrl, headers, body, method);
          // if (createUserResult.errors) {
          //   console.error("GraphQL error creating user:", createUserResult.errors);
          //   return {
          //     statusCode: 500,
          //     body: JSON.stringify({ message: "Error creating user.", details: createUserResult.errors }),
          //     headers: {
          //       "Access-Control-Allow-Origin": "*",
          //       "Content-Type": "application/json",
          //       "Access-Control-Allow-Headers": "Content-Type",
          //       "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
          //     },
          //   };
          // }
        } catch (err) {
          console.error("Network or unexpected error creating user:", err);
          return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to create user." }),
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json",
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
          };
        }
        console.log(createUserResult, "createUser");
        payload = {
          email: email,
          phone: "",
          given_name: firstName || null,
          family_name: lastName || null,
        };
        payload["custom:userId"] = newUserId;
      } else {
        payload = {
          email: email,
          phone: existingUser.phone || "", // Keep existing phone if available
          given_name: existingUser.firstName || firstName || null,
          family_name: existingUser.lastName || lastName || null,
        };
        payload["custom:userId"] = existingUser.id;

        const needsUpdate = 
          (firstName && existingUser.firstName !== firstName) ||
          (lastName && existingUser.lastName !== lastName) ||
          (address && existingUser.address !== address) ||
          existingUser.firstName === null || // Also update if initially null
          existingUser.lastName === null ||
          existingUser.address === null;


        if (needsUpdate) {
          const updatedUserData = {
            id: existingUser.id,
            firstName: firstName || existingUser.firstName, // Use new value or fallback to existing
            lastName: lastName || existingUser.lastName,
            // Ensure fullName is updated if firstName or lastName changes
            fullName: `${firstName || existingUser.firstName} ${lastName || existingUser.lastName}`.trim() || existingUser.fullName,
            address: address || existingUser.address,
            is_register: 1 // Assuming this should always be set on update if user interacts
          };
          // Only include fields that are being changed or were null
          const inputToUpdate = { id: existingUser.id, is_register: 1 };
          if (firstName && existingUser.firstName !== firstName || (existingUser.firstName === null && firstName)) {
            inputToUpdate.firstName = firstName;
          }
          if (lastName && existingUser.lastName !== lastName || (existingUser.lastName === null && lastName)) {
            inputToUpdate.lastName = lastName;
          }
          if ((firstName && existingUser.firstName !== firstName) || (lastName && existingUser.lastName !== lastName) || (existingUser.firstName === null && firstName) || (existingUser.lastName === null && lastName) || (existingUser.fullName === null && firstName && lastName) ) {
             inputToUpdate.fullName = `${inputToUpdate.firstName || existingUser.firstName} ${inputToUpdate.lastName || existingUser.lastName}`.trim();
          }
          if (address && existingUser.address !== address || (existingUser.address === null && address)) {
            inputToUpdate.address = address;
          }


          // Only call updateUser if there's something to update
          if (Object.keys(inputToUpdate).length > 2) { // id and is_register are always there
            const updateUserMutation = {
              query: updateUser, // Assuming 'updateUser' is the GraphQL mutation string defined elsewhere
              operationName: 'updateUser',
              variables: {
                input: inputToUpdate
              }
            };
            const userRequest = new HttpRequest({
              method: 'POST',
              headers: { 'Content-Type': 'application/json', host: url.hostname },
              hostname: url.hostname,
              body: JSON.stringify(updateUserMutation),
              path: url.pathname
            });
            const { headers, body, method } = await addHttpRequest(userRequest);
            var updateUserResult;
            try {
              updateUserResult =  initfetch(appsyncUrl, headers, body, method);
              // if (updateUserResult.errors) {
              //   console.error("GraphQL error updating user:", updateUserResult.errors);
              //   return {
              //     statusCode: 500,
              //     body: JSON.stringify({ message: "Error updating user.", details: updateUserResult.errors }),
              //     headers: {
              //       "Access-Control-Allow-Origin": "*",
              //       "Content-Type": "application/json",
              //       "Access-Control-Allow-Headers": "Content-Type",
              //       "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
              //     },
              //   };
              // }
            } catch (err) {
              console.error("Network or unexpected error updating user:", err);
              return {
                statusCode: 500,
                body: JSON.stringify({ message: "Failed to update user." }),
                headers: {
                  "Access-Control-Allow-Origin": "*",
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Headers": "Content-Type",
                  "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
              };
            }
            console.log(updateUserResult, "updateUser");
            // Update payload with potentially new names
            if (inputToUpdate.firstName) payload.given_name = inputToUpdate.firstName;
            if (inputToUpdate.lastName) payload.family_name = inputToUpdate.lastName;
          }
        }
      }
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify("User details required"),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
      }
    }
    var attendee = payload.email;
    var phone = payload.phone_number;



    if (paymentStatus != null && paymentStatus != undefined) {
      var { status, hosts, eventinvitationsID, invitationsAccepted,
        invitationsTotal,
        invitationsDeclined, attendeeId,
        invitationsRemaining, atStatus, userId, name, startDate, startTime, attenName, hostId, totalPaidAmount } = await updatePaymentStatus(eventId, attendee, type);
      console.log(totalPaidAmount, "totalPaidAmount");
      if (status == "Access Granted") {
        let attendeeDetails = {
          id: attendeeId,
          paymentStatus: paymentStatus,
          totalPaidAmount: paymentStatus == true ? totalPaidAmount : 0
        };
        const updateAttendee = {
          query: updateAttendeeQuery, operationName: 'updateAttendee',
          variables: {
            input: attendeeDetails,
          }
        }
        var attendeerequest = new HttpRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            host: url.hostname
          },
          hostname: url.hostname,
          body: JSON.stringify(updateAttendee),
          path: url.pathname
        });
        // Prepare HttpRequest for updateAttendee
        const updateAttendeePayload = {
          query: updateAttendeeQuery, operationName: 'updateAttendee',
          variables: {
            input: attendeeDetails,
          }
        };
        var attendeerequest = new HttpRequest({ // This var was defined before, ensure it's the same
          method: 'POST',
          headers: { 'Content-Type': 'application/json', host: url.hostname },
          hostname: url.hostname,
          body: JSON.stringify(updateAttendeePayload),
          path: url.pathname
        });

        // Prepare HttpRequest for listNotificationTypes
        var getNotificationTypePayload = {
          query: listNotificationTypes,
          variables: {
            filter: { type: { eq: "Payment" } },
            limit: 100000
          }
        };
        var getNotificationTypeReq = new HttpRequest({
          hostname: url.hostname,
          path: url.pathname,
          body: JSON.stringify(getNotificationTypePayload),
          method: 'POST',
          headers: { 'Content-Type': 'application/json', host: url.hostname },
        });

        // Sign both requests
        const signedUpdateAttendeeReq = await addHttpRequest(attendeerequest);
        const signedGetNotificationTypeReq = await addHttpRequest(getNotificationTypeReq);

        // Execute both initfetch calls in parallel
        const [attendeeResult, getNotificationTypesResult] = await Promise.all([
          initfetch(appsyncUrl, signedUpdateAttendeeReq.headers, signedUpdateAttendeeReq.body, signedUpdateAttendeeReq.method),
          initfetch(appsyncUrl, signedGetNotificationTypeReq.headers, signedGetNotificationTypeReq.body, signedGetNotificationTypeReq.method)
        ]);

        const attendee = attendeeResult; // Maintain variable name for subsequent code
        console.log(attendee, "------------->attendee");
        
        var getNotificationTypes = getNotificationTypesResult; // Maintain variable name
        var notificationTypeId = getNotificationTypes.data.listNotificationTypes?.items.length > 0 ? getNotificationTypes.data.listNotificationTypes?.items[0] : "";
        console.log(notificationTypeId, "qqqqqqnotificationTypeId");
        if (notificationTypeId != "") {
          var token = null;
          var notificationList = [];
          for (var tok = 1; tok != 0;) {
            const getNotificationList = {
              query: getNotificationQuery,
              variables: {
                filter: { and: { notificationsUserId: { eq: userId }, notificationsNotificationTypeId: { eq: notificationTypeId.id } }, notificationsEventId: { eq: eventId } },
                limit: 1000000,
                nextToken: token
              }
            }
            const getNotificationListReq = new HttpRequest({
              hostname: url.hostname,
              path: url.pathname,
              body: JSON.stringify(getNotificationList),
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                host: url.hostname,
              },
            });
            var { headers, body, method } = await addHttpRequest(getNotificationListReq)
            var allPaymentNotification = await initfetch(appsyncUrl, headers, body, method);
            token = allPaymentNotification?.data?.listNotifications?.nextToken;
            notificationList.push(...allPaymentNotification?.data?.listNotifications?.items)
            if (token != null) {
              tok++
            } else {
              tok = 0;
            }
          }
          if (notificationList.length > 0) {
            const currentDate = new Date(); // Current date
            currentDate.setDate(currentDate.getDate() + 1); // Add 4 days
            const newDate = currentDate.toISOString().slice(0, 10);
            var message = {
              id: notificationList[0]?.id,
              IsEmailDelivered: paymentStatus == true ? true : false,
              IsPushDelivered: paymentStatus == true ? true : false,
              PushNumberofAttempts: paymentStatus == true ? 1 : 0,
              createdDate: newDate
            };
            await updateNotificationStatus(message);
          }
          var notificationss = [];

          var pushmessage = `${attenName} has verified that the payment status for the event ${name} is "${paymentStatus === true ? 'Paid' : 'Unpaid'}"`;
          notificationss.push({
            id: uuidv4(),
            notificationsEventId: eventId,
            notificationsUserId: hostId,
            notificationsNotificationTypeId: uuidv4(),
            NotificationMessage: pushmessage,
            IsEmailDelivered: false,
            EmailNumberofAttempts: -1,
            EmailStatusMessage: "",
            IsPushDelivered: false,
            PushNumberofAttempts: 0,
            PushStatusMessage: "",
            IsSMSDelivered: false,
            SmsNumberofAttempts: -1,
            SMSStatusMessage: "",
            SMSMessage: pushmessage,
            EventName: name,
            EventStartDate: startDate,
            EventStartTime: startTime,
            createdDate: new Date().toISOString().slice(0, 10)
          })
          console.log(notificationss, "notificationss")
          // Corrected: Changed forEach to Promise.all for concurrent async operations
          await Promise.all(notificationss.map(async (g) => {
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
            var { headers: notifHeaders, body: notifBody, method: notifMethod } = await addHttpRequest(notificationRequest)
            var notificationsssss = await initfetch(appsyncUrl, notifHeaders, notifBody, notifMethod);
            console.log(notificationsssss, "notificationsss");
          }));
        }
        return {
          statusCode: 200,
          body: JSON.stringify("Payment Status Successfully Updated"),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
          },
        }
      }
    }

    const RSVP_CATEGORIES = new Set([
      "SOCIAL", "CORPORATE", "BIRTHDAY", "ANNIVERSARY", "HOLIDAY", "REUNION",
      "BABY_SHOWER", "BRIDAL_SHOWER", "BACHELOR_PARTY", "BACHELORETTE_PARTY",
      "GRADUATION_PARTY", "GIRLS_NIGHT_OUT", "DINNER_PARTY", "SPORTS_GATHERING",
      "PROM", "MITZVAH", "REHEARSAL_DINNER", "QUINCEANERA", "SUMMER_PICNIC",
      "SCHOOL_FUNCTION", "POOL_PARTY", "RELIGIOUS_EVENT", "FESTIVAL_PARTY",
      "NEW_YEAR_PARTY", "SWEET_16", "SOCIAL_GATHERING", "GET_TOGETHER",
      "POTLUCK", "NAMING_CEREMONY", "HOUSE_WARMING"
    ]);
    var notificationsss = [];


    var { status, hosts, eventinvitationsID, invitationsAccepted,
      invitationsTotal,
      invitationsDeclined, attendeeId,
      invitationsRemaining, atStatus, userId, name, startDate, startTime, category, paymentType } = await verifyUser(eventId, attendee, type, payload["custom:userId"], phone, attendeeStatus, comment, adultsCount, kidsCount);
    if (status == "Access Granted") {
      console.log(type, category, attendeeStatus, atStatus, paymentType)
      let attendeeDetails = {
        id: attendeeId,
        eventinvitationsID: eventinvitationsID,
        status: attendeeStatus,
        adultsCount: adultsCount ? adultsCount : 1,
        kidsCount: kidsCount ? kidsCount : 0,
        comment: comment ? comment : null
      };
      console.log(attendeeDetails, "------------->attendeeDetails");

      // Prepare HttpRequest for updateAttendee
      const updateAttendeePayload = {
        query: updateAttendeeQuery, operationName: 'updateAttendee',
        variables: { input: attendeeDetails }
      };
      var attendeerequest = new HttpRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', host: url.hostname },
        hostname: url.hostname,
        body: JSON.stringify(updateAttendeePayload),
        path: url.pathname
      });

      // Logic to calculate new invitationsDeclined, invitationsAccepted
      if (atStatus == "PENDING") {
        invitationsDeclined = attendeeStatus == "DECLINED" ? invitationsDeclined + 1 : invitationsDeclined;
        invitationsAccepted = attendeeStatus == "ACCEPTED" ? invitationsAccepted + 1 : invitationsAccepted;
      } else {
        invitationsDeclined = atStatus == "DECLINED" && (attendeeStatus == "PENDING" || attendeeStatus == "ACCEPTED") ? invitationsDeclined - 1 : invitationsDeclined;
        invitationsAccepted = atStatus == "ACCEPTED" && (attendeeStatus == "PENDING" || attendeeStatus == "DECLINED") ? invitationsAccepted - 1 : invitationsAccepted;
        invitationsAccepted = atStatus == "DECLINED" && attendeeStatus == "ACCEPTED" ? invitationsAccepted + 1 : invitationsAccepted;
        invitationsDeclined = atStatus == "ACCEPTED" && attendeeStatus == "DECLINED" ? invitationsDeclined + 1 : invitationsDeclined;
      }
      let eventInvitationsDetails = { // Renamed to avoid conflict with 'eventInvitations' GraphQL query name if any
        id: eventinvitationsID,
        invitationsDeclined: invitationsDeclined,
        invitationsAccepted: invitationsAccepted
      };
      console.log(eventInvitationsDetails, "------------->eventInvitationsDetails");
      
      // Prepare HttpRequest for updateEventInvitations
      const updateEventInvitationPayload = {
        query: updateEventInvitationQuery, operationName: 'updateEventInvitations',
        variables: { input: eventInvitationsDetails }
      };
      var invitationrequest = new HttpRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', host: url.hostname },
        hostname: url.hostname,
        body: JSON.stringify(updateEventInvitationPayload),
        path: url.pathname
      });

      // Sign both requests in parallel
      const [signedAttendeeReq, signedInvitationReq] = await Promise.all([
        addHttpRequest(attendeerequest),
        addHttpRequest(invitationrequest)
      ]);

      // Execute both initfetch calls in parallel
      const [attendeeResult, invitationResult] = await Promise.all([
        initfetch(appsyncUrl, signedAttendeeReq.headers, signedAttendeeReq.body, signedAttendeeReq.method),
        initfetch(appsyncUrl, signedInvitationReq.headers, signedInvitationReq.body, signedInvitationReq.method)
      ]);

      console.log(attendeeResult, "------------->attendeeResult"); // Log results
      console.log(invitationResult, "------------->invitationResult");

      var pay = JSON.parse(event.body)
      var headers = {
        headers: event?.headers?.Authorization
      };
      axios
        .post("https://api.test.togatherevent.com/updateInvitationTrigger", pay, {
          headers,
        })

      return {
        statusCode: 200,
        body: JSON.stringify("Attendee Successfully Updated"),
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
      }
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