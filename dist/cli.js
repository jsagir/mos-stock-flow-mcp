#!/usr/bin/env node
import { runCli } from "./cli/commands.js";
process.exitCode = await runCli(process.argv.slice(2));
