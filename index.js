//const core = require('@actions/core');
const github = require('@actions/github');

const DISCORD_API_BASE_PATH = "https://discord.com/api/v9";

/**
 * @returns {{id: string, type: string}} 
 */
const getProps = () => {
  const payload = github.context.payload.client_payload;
  if (!payload.id) throw new TypeError("payload id should be not empty");
  if (!payload.type) throw new TypeError("payload type should be not empty");
  return {
    id: payload.id, 
    type: payload.type,
  };
}

const getContent = async ({ contentID, microCMSAPIKey, microCMSServiceID }) => {
  const header = {
    "X-MICROCMS-API-KEY": microCMSAPIKey
  }
  const url = `https://${microCMSServiceID}.microcms.io/api/v1/message/${contentID}`;
  const result = await fetch(url, {
    headers: header
  });
  const json = await result.json();
  return json;
}

/**
 * @returns {{microCMSAPIKey: string, microCMSServiceID: string}}
 */
const getEnv = () => {
  const microCMSAPIKey = process.env.MICROCMS_API_KEY;
  const microCMSServiceID = process.env.MICROCMS_SERVICE_ID;
  if (!microCMSAPIKey) throw new TypeError("env value MICROCMS_API_KEY should be not empty");
  if (!microCMSServiceID) throw new TypeError("env value MICROCMS_API_KEY should be not empty");
  return {
    microCMSAPIKey, microCMSServiceID
  }
}

const getChannelIDFromURL = (channelURL) => {
  const channelURLRegExp = RegExp(/https:\/\/discord.com\/channels\/\d+\/(\d+)/);
  const result = channelURLRegExp.exec(channelURL);
  if (result === null) throw new Error("channelURL format is invalid");
  return result[1];
}

const createMessage = async (content) => {
  const channelID = getChannelIDFromURL(content.channelURL);
  
  await fetch(`${DISCORD_API_BASE_PATH}/channels/${channelID}/messages`, {
    method: "POST",
    body: {
      ...content.message
    }
  });
}

const main = async () => {
  const { microCMSAPIKey, microCMSServiceID } = getEnv();
  const { id, type } = getProps();
  const content = await getContent({
    microCMSAPIKey,
    microCMSServiceID,
    contentID: id
  });

  if (type === "new") {
    await createMessage(content);
  }

  if (type === "edit") {
  }
}

main().then(() => {
  console.log("process completed");
})