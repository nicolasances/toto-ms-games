import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { Game, GameStatus } from "./GameModel";
import { Games } from "./Games";
import { KuploadGame } from "./kud/KuploadGame";
import { RekoncileGame } from "./rekoncile/RekoncileGame";

/**
 * This class manages the overview of all Games
 */
export class GamesManager {

    userContext: UserContext;
    execContext: ExecutionContext;
    authHeader: string;

    constructor(userContext: UserContext, execContext: ExecutionContext, authHeader: string) {

        this.userContext = userContext;
        this.execContext = execContext;
        this.authHeader = authHeader;

    }

    /**
     * Retrieves the overview of all games.
     * 
     * What the Overview provides is: 
     *  - The score of each game
     *  - The overall level of the player
     */
    async getGamesOverview(): Promise<GamesOverview> {

        // Get the score from each game
        const gameStatuses: SingleGameOverview[] = []

        for (let gameKey of Object.keys(Games)) {

            // Get the Game Manager's class name
            const gameConstructor = Games[gameKey].newManager;

            if (gameConstructor) {

                // Instantiate the Game's Manager
                const game = gameConstructor(this.userContext, this.execContext, this.authHeader);

                // Get the Game Status
                const gameStatus = await game.getGameStatus();

                // Store the status
                gameStatuses.push({
                    gameKey: gameKey,
                    gameStatus: gameStatus
                })
            }

        }

        // Calculate the overall level of the player
        const playerLevel = this.getPlayerLevel(gameStatuses)

        return {
            playerLevel: playerLevel,
            gamesStatuses: gameStatuses
        }

    }

    /**
     * Calculates the Player's score based on the status of each game
     * 
     * @param gameStatuses a list containing the status of each game
     */
    getPlayerLevel(gameStatuses: SingleGameOverview[]): PlayerLevel {

        // Define levels
        const levels = [
            { level: PlayerLevels.fishy, minScore: 0, passScore: 380 },
            { level: PlayerLevels.monkey, minScore: 380, passScore: 1000 },
            { level: PlayerLevels.cake, minScore: 1000, passScore: 3000 }, 
            { level: PlayerLevels.birdie, minScore: 3000, passScore: 7000 }, 
            { level: PlayerLevels.robot, minScore: 7000, passScore: 18000 },
        ]

        // Get the player progress
        const playerScore = this.getPlayerScore(gameStatuses);

        // Get the right level
        for (let level of levels) {

            if (playerScore.score >= level.minScore && playerScore.score < level.passScore) return new PlayerLevel(level.level, playerScore, new LevelPoints(level.minScore, level.passScore))

        }

        return new PlayerLevel(PlayerLevels.fishy, playerScore, new LevelPoints(0, 100000));
    }

    /**
     * Calculates the player's overall progress as a "points" score
     * 
     * @param gameStatuses the list of every game's status
     */
    getPlayerScore(gameStatuses: SingleGameOverview[]) {

        let score = 0;
        let maxScore = 0;

        for (let status of gameStatuses) {

            score += status.gameStatus.score;

        }

        return { score: score }

    }

}

/**
 * Player Levels that are currently managed in Toto!
 */
export const PlayerLevels = {
    fishy: {
        id: "fishy",
        title: "Fishy",
        desc: "It stinks a bit.. Your data is underwater.. You get the point, you need to start playing games to clean it all up and get your data quality up!",
    } as Level,
    monkey: {
        id: "monkey",
        title: "Monkey",
        desc: "A monkey could have been taking care of your data, for what I know. But it's a bit better than before! So keep paying that monkey to play games!",
    } as Level,
    cake: {
        id: "cake",
        title: "Cake",
        desc: "Now your data smells good! A freshly baked cake! There is still a lot to do though, so don't stop playing!"
    } as Level,
    birdie: {
        id: "birdie",
        title: "Birdie",
        desc: "You're flying high and have a good overview of the situation... and it's not bad at all! You've done a lot to get better quality data, go on!"
    } as Level,
    robot: {
        id: "robot",
        title: "Robot",
        desc: "Everything looks like it has been fixed by some Superintelligent AI! Well done, the data quality is quite good! Care to go even higher?"
    } as Level
}

interface Level {
    id: string,
    title: string,
    desc: string
}

interface SingleGameOverview {
    gameKey: string,
    gameStatus: GameStatus
}

interface PlayerScore {
    score: number,
}

class LevelPoints {
    
    minScore: number
    passScore: number

    constructor(minScore: number, passScore: number) {
        this.minScore = minScore
        this.passScore = passScore
    }
}

export class PlayerLevel {

    level: Level
    progress: PlayerScore
    levelPoints: LevelPoints

    constructor(level: Level, progress: PlayerScore, levelPoints: LevelPoints) {
        this.level = level
        this.progress = progress;
        this.levelPoints = levelPoints;
    }
}

interface GamesOverview {

    playerLevel: PlayerLevel,
    gamesStatuses: SingleGameOverview[]

}