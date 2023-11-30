import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { FakeRequest, TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { TotoEvent } from "./TotoEvent";
import { AEventHandler } from "./EventHanlder";
import { EVENTS } from "./EventPublisher";
import { OnKudProcessed } from "./handlers/OnKudProcessed";

export class KudEventHandlerHook implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        logger.compute(cid, `Received a Kud Event from PubSub`);

        const HANDLERS: IIndexable = {

            [ACCEPTED_EVENTS.kudProcessed]: [new OnKudProcessed(userContext, execContext)],

        }

        const totoEvent = JSON.parse(String(Buffer.from(req.body.message.data, 'base64'))) as TotoEvent;

        // Find the right event handler 
        if (HANDLERS[totoEvent.type]) {

            for (const handler of HANDLERS[totoEvent.type]) {

                await handler.handleEvent(totoEvent);

            }

        }

        return { processed: true }

    }

}

export interface IIndexable {
    [key: string]: Array<AEventHandler>;
}

export const ACCEPTED_EVENTS = {

    // A Kud has been successfully processed by the toto-ms-kud
    kudProcessed: "kudProcessed"

}