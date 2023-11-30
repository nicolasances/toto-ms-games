import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { KudDocGame } from "../../games/kud/KudDocGame";
import { AEventHandler, EventHandlingResult } from "../EventHanlder";
import { TotoEvent } from "../TotoEvent";

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

        await new KudDocGame(this.userContext, this.execContext).onKudProcessed(kudId, userEmail);

        return { eventProcessed: true }

    }

}