import { Request } from "express";
import { ControllerConfig } from "../../../Config";
import { Storage } from "@google-cloud/storage";
import { EVENTS, EventPublisher } from "../../../evt/EventPublisher";
import { KuploadGame, kudId } from "../../../games/kud/KuploadGame";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

const storage = new Storage();


/**
 * This Delegate allows the user to signal that a Kud is missing
 */
export class PostMissingKud implements TotoDelegate {

  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const logger = execContext.logger;
    const cid = execContext.cid;

    const year = req.body.year;
    const month = req.body.month;

    logger.compute(cid, `User ${userContext.email} is signaling that KUD [year: ${year}, month: ${month}] is missing.`, "info");

    // Validation
    if (!userContext.email) throw new ValidationError(400, "No user found in the context. Check Auth token.")
    if (!year) throw new ValidationError(400, "No Year provided");
    if (!month) throw new ValidationError(400, "No Month provided");

    // Save the Game
    await new KuploadGame(userContext, execContext, String(extractAuthHeader(req))).onKudMissing(kudId(parseInt(year), parseInt(month)), userContext.email)

    return { updated: true }

  }
}
