import * as core from '@actions/core'
import * as github from '@actions/github'

console.log(JSON.stringify(github.context.payload));
console.log(github.context.action);