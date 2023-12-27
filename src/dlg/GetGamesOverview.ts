import { Request } from "express";
import { GamesManager } from "../games/GamesManager";
import { extractAuthHeader } from "../util/AuthHeader";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";


export class GetGamesOverview implements TotoDelegate {
    
    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Get the Overview
        const overview = new GamesManager(userContext, execContext, String(extractAuthHeader(req))).getGamesOverview();

        return overview;
    }

}