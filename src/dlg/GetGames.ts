import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { ValidationError } from "../controller/validation/Validator";
import { ControllerConfig } from "../Config";
import { TotoRuntimeError } from "../controller/model/TotoRuntimeError";
import { TotoDelegate } from "../controller/model/TotoDelegate";
export class GetGames implements TotoDelegate {

  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const logger = execContext.logger;
    const cid = execContext.cid;
    const config = execContext.config as ControllerConfig;

    logger.compute(cid, `Retrieving games for user ${userContext.email}`, "info");

    // Validation
    if (!userContext.email) throw new ValidationError(400, "No user found in the context. Check Auth token.")

    let client;

    try {

      client = await config.getMongoClient();
      const db = client.db(config.getDBName());
      return { msg: "Not Implemented Yet" }

    } catch (error) {

      logger.compute(cid, `${error}`, "error")

      if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
        throw error;
      }
      else {
        console.log(error);
        throw error;
      }

    }
    finally {
      if (client) client.close();
    }
  }
}

interface Filter {
  maxResults?: number,
  user?: string
}