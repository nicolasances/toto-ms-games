import { Request } from "express";
import { TotoEvent } from "./TotoEvent";
import { AEventHandler } from "./EventHanlder";
import { OnKudProcessed } from "./handlers/OnKudProcessed";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

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