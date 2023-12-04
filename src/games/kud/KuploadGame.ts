import moment from "moment-timezone";
import { ControllerConfig } from "../../Config";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { Logger } from "../../logger/TotoLogger";
import { KudDocGameStore, KudPO, KudStatus } from "../../store/KudDocGameStore";
import { Game, GameStatus } from "../GameModel";

const SCORE_PER_KUD = 20

/**
 * Kupload Game 
 * ---------------------
 * This game asks the user to upload DanskeBank's quaterly Kontoudskrift (statement).
 * The user just needs to upload the document. The document will then be parsed, and if valid, the user will be rewwarded with data quality points.
 * ---------------------
 */
export class KuploadGame extends Game {


    /**
     * To pass, the user needs the equivalent of 80% of the kud documents uploaded
     */
    pointsToPass(): number {

        // Get the total amount of needed KUDs
        const numNeededKuds = this.getFullKudsList().length;

        // Calculate 80% of that and multiply to get the score
        const scoreToPass = Math.floor(numNeededKuds * SCORE_PER_KUD * 0.8)

        return scoreToPass;

    }

    /**
     * Returns the status of the game
     */
    async getGameStatus(): Promise<KuploadGameStatus> {

        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            // Get the full list of kuds that need to be stored
            const fullKudList = this.getFullKudsList()

            // Calculate the max score
            const maxScore = fullKudList.length * SCORE_PER_KUD

            // Retrieve the game info from DB
            const gamePO = await new KudDocGameStore(db, this.config).getGame(this.userEmail);

            // If there is no game yet, return 
            if (!gamePO) return {
                score: 0, 
                maxScore: maxScore, 
                percCompletion: 0, 
                missingKuds: fullKudList, 
                numMissingKuds: fullKudList.length
            }

            // Get the missing kuds
            const missingKuds = this.getMissingKudsFromCompletedKuds(gamePO.kuds);

            // Calculate the current score
            const score = gamePO.kuds ? gamePO.kuds.length * SCORE_PER_KUD : 0

            // Calculate the percentage of completion
            const completionPerc = Math.floor(100 * score / maxScore)

            // Return the data
            return {
                score: score,
                maxScore: maxScore,
                percCompletion: completionPerc,
                missingKuds: missingKuds, 
                numMissingKuds: missingKuds ? missingKuds.length : 0

            }

        } catch (error) {

            this.logger.compute(this.cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }
        finally {
            if (client) client.close();
        }

    }

    /**
     * Generates the list of quaterly kuds that need to be completed to earn data quality points
     * The list is made by all quaterly documents in the form (year, month) that DanskeBank generated since 01.01.2018
     */
    getFullKudsList() {

        const startYear = 2018
        const startMonth = 3

        const endYear = parseInt(moment().tz("Europe/Rome").format("YYYY"))
        const endMonth = parseInt(moment().tz("Europe/Rome").format("MM"))

        let curYear = startYear
        let curMonth = startMonth

        let stop = false;

        let kuds = [] as KudYearMonth[]

        while (!stop) {

            // Add the kud for the current year and month
            kuds.push({ year: curYear, month: curMonth })

            // Increase the month
            curMonth += 3
            if (curMonth > 12) {
                curMonth = 3
                curYear++
            }

            // Stopping condition
            if (curYear > endYear) stop = true;
            else if (curYear == endYear && curMonth > endMonth) stop = true;

        }

        return kuds
    }

    /**
     * Returns the list of kuds that the user should still upload
     * @param completedKuds a list of completed kuds (extracted from DB)
     */
    getMissingKudsFromCompletedKuds(completedKuds: KudPO[]): MissingKud[] {

        // Get the full list of kuds
        const fullKuds = this.getFullKudsList()

        // Create a map of completed kuds, where the key is the YYYYMM of the kud
        let completedKudsMap = {} as any

        for (let i = 0; i < completedKuds.length; i++) {

            // Id Components will be arrays like ["kud", "2023", "03"]
            const kudIdComponents = completedKuds[i].kudId.split("-")

            // Map Keys will be strings like 202311 or 202203
            const key = `${kudIdComponents[1]}${kudIdComponents[2]}`

            // Add the object to the map
            completedKudsMap[key] = completedKuds[i]

        }

        this.logger.compute(this.cid, `Map of Completed Kuds computed: [${JSON.stringify(completedKudsMap)}]`)

        // Compare the two lists and find the missing Kuds
        let missingKuds = [] as KudYearMonth[]

        for (let i = 0; i < fullKuds.length; i++) {

            let expectedYear = String(fullKuds[i].year)
            let expectedMonth = String(fullKuds[i].month)

            // Make sure that the month is expressed as a string padded with a zero (e.g. 03, 11, ...)
            if (expectedMonth.length == 1) expectedMonth = `0${expectedMonth}`

            // Build the search key
            const searchKey = `${expectedYear}${expectedMonth}`

            // Search for the corresponding completed kud, if any
            if (!completedKudsMap[searchKey]) missingKuds.push(fullKuds[i])

        }

        this.logger.compute(this.cid, `Missing Kuds computed: [${JSON.stringify(missingKuds)}]`)

        return missingKuds

    }

    /**
     * Retrieves the list of kuds that still need to be uploaded for the user in the userContext
     */
    async getMissingKuds() {

        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            // Get the list of completed kuds
            const completedKuds = await new KudDocGameStore(db, this.config).getKuds(this.userEmail)

            return this.getMissingKudsFromCompletedKuds(completedKuds);

        } catch (error) {

            this.logger.compute(this.cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }
        finally {
            if (client) client.close();
        }

    }

    /**
     * Reacts to an event of kud uploaded 
     * 
     * This method will update that kud's state as "uploaded"
     */
    async onKudUploaded(kudId: string, userEmail: string) {


        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            this.logger.compute(this.cid, `Updating Game to register Kud Doc Upload`)

            // Update the kud game with a new kud uploaded
            await new KudDocGameStore(db, this.config).onKudUploaded(userEmail, kudId);


        } catch (error) {

            this.logger.compute(this.cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }
        finally {
            if (client) client.close();
        }

    }

    /**
     * Reacts to an event of kud processed (by the toto-ms-kud microservice).
     * 
     * This method will perform the following: 
     * 1. Find the kud in the list of kuds that have been uploaded 
     * 2. Update that kud's state as "processed"
     */
    async onKudProcessed(kudId: string, userEmail: string) {

        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            // Update the kud
            await new KudDocGameStore(db, this.config).updateKudStatus(userEmail, kudId, KudStatus.processed)


        } catch (error) {

            this.logger.compute(this.cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }
        finally {
            if (client) client.close();
        }

    }

}

export interface KuploadGameStatus extends GameStatus {
    missingKuds: MissingKud[]   // Array with the list of missing kuds
    numMissingKuds: number      // Number of missing kuds (length of the missingKuds array)
}

/**
 * Defines a missing kud
 */
export interface MissingKud {
    year: number,
    month: number
}

export interface KudYearMonth {
    year: number
    month: number
}

/**
 * Generates a kud Id based on the reference year and month
 * @param year the year as an integer
 * @param month the month as an integer
 */
export function kudId(year: number, month: number) {

    let yearString = String(year)
    let monthString = String(month)

    if (monthString.length == 1) monthString = `0${monthString}`

    return `kud-${yearString}-${monthString}`

}