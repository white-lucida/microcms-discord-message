//const core = require('@actions/core');
const github = require('@actions/github');

const DISCORD_API_BASE_PATH = "https://discord.com/api/v9";

/**
 * @returns {{id: string, type: string}} 
 */
const getProps = () => {
  const payload = github.context.payload.client_payload;
  if (!payload.id) throw new TypeError("payload id should not be empty");
  if (!payload.type) throw new TypeError("payload type should not be empty");
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
 * @returns {{microCMSAPIKey: string, microCMSServiceID: string, discordToken: string}}
 */
const getEnv = () => {
  const microCMSAPIKey = process.env.MICROCMS_API_KEY;
  const microCMSServiceID = process.env.MICROCMS_SERVICE_ID;
  const discordToken = process.env.DISCORD_TOKEN;
  if (!microCMSAPIKey) throw new TypeError("env value MICROCMS_API_KEY should not be empty");
  if (!microCMSServiceID) throw new TypeError("env value MICROCMS_API_KEY should not be empty");
  if (!discordToken) throw new TypeError("env value DISCORD_TOKEN should not be empty");
  return {
    microCMSAPIKey, microCMSServiceID, discordToken
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
  const { discordToken } = getEnv();
  const header = {
    Authorization: `Bot: ${discordToken}`
  };
  
  await fetch(`${DISCORD_API_BASE_PATH}/channels/${channelID}/messages`, {
    method: "POST",
    body: {
      ...content.message
    },
    headers: header
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