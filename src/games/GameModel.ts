import { ControllerConfig } from "../Config";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { Logger } from "../logger/TotoLogger";

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
    maxScore: number            // Maximum achievable score
    percCompletion: number      // Percentage of completion (expresssed as %, e.g. 50), rounded to 0 decimal places. Min is 0.
}