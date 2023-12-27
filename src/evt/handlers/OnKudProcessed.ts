import { KuploadGame } from "../../games/kud/KuploadGame";
import { AEventHandler, EventHandlingResult } from "../EventHanlder";
import { TotoEvent } from "../TotoEvent";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

/**
 * Handles "kudProcessed" events from toto-ms-kud microservice.
 * 
 * This handler will update the Kud Doc Game by marking the processed kud as "processed", hence removing that 
 * kud from the list of kuds to process, which will increase the data quality score of the user.
 */
export class OnKudProcessed extends AEventHandler {

    userContext: UserContext;

    constructor(userContext: UserContext, execContext: ExecutionContext) {
        super(execContext);
        this.userContext = userContext;
    }

    async handleEvent(msg: TotoEvent): Promise<EventHandlingResult> {

        const kudId = msg.id
        const userEmail = msg.data.userEmail

        await new KuploadGame(this.userContext, this.execContext, String()).onKudProcessed(kudId, userEmail);

        this.execContext.logger.compute(this.execContext.cid, `Successfully processed kud [${kudId}] for user [${userEmail}]`)

        return { eventProcessed: true }

    }

}