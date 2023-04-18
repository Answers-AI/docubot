#!/usr/bin/env node
const docubot = require("./src/docubot.js");
const pinecone = require("./src/pinecone.js");

module.exports = {
  docubot,
  pinecone,
};