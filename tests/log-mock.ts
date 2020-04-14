import { Mock } from "typemoq";
import { LoggerWithTarget } from "probot/lib/wrap-logger";

export const nullLog = Mock.ofType<LoggerWithTarget>().object;