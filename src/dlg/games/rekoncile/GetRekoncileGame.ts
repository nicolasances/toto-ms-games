import { Request } from "express-serve-static-core";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { RekoncileGame } from "../../../games/rekoncile/RekoncileGame";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

/**
 * Retrieves information about the Rekoncile Game
 */
export class GetRekoncileGame implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Retrieve the game
        return await new RekoncileGame(userContext, execContext, String(extractAuthHeader(req))).getGameStatus();

    }

}