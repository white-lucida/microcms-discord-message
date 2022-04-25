//const core = require('@actions/core');
const github = require('@actions/github');

console.log(JSON.stringify(github.context.payload));
console.log(github.context.action);