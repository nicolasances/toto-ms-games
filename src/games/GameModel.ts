import { ControllerConfig } from "../Config";
import { Logger } from "../logger/TotoLogger";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

export interface IGame {}

/**
 * Abstract Class that represent a Toto Game
 */
export abstract class Game implements IGame {

    userEmail: string;
    logger: Logger;
    cid: string | undefined;
    config: ControllerConfig;
    userContext: UserContext;
    execContext: ExecutionContext;
    authHeader: string;

    constructor(userContext: UserContext, execContext: ExecutionContext, authHeader: string) {

        this.userEmail = userContext.email;
        this.logger = execContext.logger;
        this.cid = execContext.cid;
        this.config = execContext.config as ControllerConfig;
        this.userContext = userContext;
        this.execContext = execContext;
        this.authHeader = authHeader;

    }

    abstract getGameStatus(): Promise<GameStatus>

}

export interface GameStatus {
    score: number               // Current score for the user. Minimum is 0
}