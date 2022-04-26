//const core = require('@actions/core');
const github = require("@actions/github");
const { default: axios } = require("axios");

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
};

const getContent = async ({ contentID, microCMSAPIKey, microCMSServiceID }) => {
  const headers = {
    "X-MICROCMS-API-KEY": microCMSAPIKey,
  };
  const result = await axios.get(
    `https://${microCMSServiceID}.microcms.io/api/v1/message/${contentID}`,
    { headers }
  );
  return result.data;
};

/**
 * @returns {{microCMSAPIKey: string, microCMSServiceID: string, discordToken: string}}
 */
const getEnv = () => {
  const microCMSAPIKey = process.env.MICROCMS_API_KEY;
  const microCMSServiceID = process.env.MICROCMS_SERVICE_ID;
  const discordToken = process.env.DISCORD_TOKEN;
  if (!microCMSAPIKey)
    throw new TypeError("env value MICROCMS_API_KEY should not be empty");
  if (!microCMSServiceID)
    throw new TypeError("env value MICROCMS_API_KEY should not be empty");
  if (!discordToken)
    throw new TypeError("env value DISCORD_TOKEN should not be empty");
  return {
    microCMSAPIKey,
    microCMSServiceID,
    discordToken,
  };
};

const getChannelIDFromURL = (channelURL) => {
  const channelURLRegExp = RegExp(
    /https:\/\/discord.com\/channels\/\d+\/(\d+)/
  );
  const result = channelURLRegExp.exec(channelURL);
  if (result === null) throw new Error("channelURL format is invalid");
  return result[1];
};

const createMessage = async (content) => {
  const channelID = getChannelIDFromURL(content.channel_url);
  const { discordToken } = getEnv();
  const headers = {
    Authorization: `Bot ${discordToken}`,
  };

  const res = await axios.post(
    `${DISCORD_API_BASE_PATH}/channels/${channelID}/messages`,
    content.message,
    { headers }
  );

  if (!res.status.toString().startsWith("2")) throw new Error(`Discord create message API returned error response - ${res.status}`);
  return res.data;
};

const editMessage = async (content) => {
  const channelID = getChannelIDFromURL(content.channel_url);
  const { discordToken } = getEnv();
  const headers = {
    Authorization: `Bot ${discordToken}`,
  };

  const res = await axios.post(
    `${DISCORD_API_BASE_PATH}/channels/${channelID}/messages/${content.message_id}`,
    content.message,
    { headers }
  );

  if (!res.status.toString().startsWith("2")) throw new Error(`Discord create message API returned error response - ${res.status}`);
  return res.data;
}

const setMessageID = async ({ message, content, microCMSAPIKey, microCMSServiceID, contentID }) => {
  const headers = {
    "X-MICROCMS-API-KEY": microCMSAPIKey,
  };
  const res = await axios.patch(
    `https://${microCMSServiceID}.microcms.io/api/v1/message/${contentID}`,
    { ...content, message_id: message.id },
    { headers }
  );
  if (res.status !== 200) throw new Error("Editing of microcms content has failed");
}

const main = async () => {
  const { microCMSAPIKey, microCMSServiceID } = getEnv();
  const { id, type } = getProps();

  const content = await getContent({
    microCMSAPIKey,
    microCMSServiceID,
    contentID: id,
  });

  if (type === "new") {
    const message = await createMessage(content);
    await setMessageID({ content, microCMSAPIKey, microCMSServiceID, contentID: id, message });
  }

  if (type === "edit") {
    if (!content.message_id) throw new Error("message_id should not be empty when you want to edit the message");
    await editMessage(content);
  }
};

main().then(() => {
  console.log("process completed");
});
