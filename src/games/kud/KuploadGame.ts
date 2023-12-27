import moment from "moment-timezone";
import { KudDocGameStore, KudPO, KudStatus } from "../../store/KudDocGameStore";
import { Game, GameStatus } from "../GameModel";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

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
     * Returns the status of the game
     */
    async getGameStatus(): Promise<KuploadGameStatus> {

        let client;

        this.logger.compute(this.cid, `Computing Kupload Game Status`)

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            // Get the full list of kuds that need to be stored
            const fullKudList = this.getFullKudsList()

            // Retrieve the game info from DB
            const gamePO = await new KudDocGameStore(db, this.config).getGame(this.userEmail);

            // If there is no game yet, return 
            if (!gamePO) return {
                score: 0,
                missingKuds: fullKudList,
                numMissingKuds: fullKudList.length
            }

            // Get the missing kuds
            const missingKuds = this.getMissingKudsFromCompletedKuds(gamePO.kuds, false);

            // Calculate the current score, excluding MISSING ones
            let score = 0;
            
            if (gamePO.kuds) {
                for (let kud of gamePO.kuds) if (kud.status != KudStatus.missing) score += SCORE_PER_KUD;
            }

            // Return the data
            return {
                score: score,
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

        // Define when the list should end
        // The list should end the month before the current (since as long as the month isn't finished, there is no Kud available from DB)
        const endDate = moment().tz("Europe/Rome").add(-1, "months")
        const endYear = parseInt(endDate.tz("Europe/Rome").format("YYYY"))
        const endMonth = parseInt(endDate.tz("Europe/Rome").format("MM"))

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
     * @param excludeMissing pass true to exclude missing KUDs (a.k.a KUDs that the user has signalled as missing)
     *      Excluding these KUDs makes sure that the user doesn't score higher just because it has signalled that
     *      a KUD is missing. Missing KUDs are excluded from the score. 
     *      This parameter should be mostly used when calculating score, not when calculating the list of KUDs that the 
     *      user still has to upload (since missing KUDs have been signaled as such and it doesn't make sense to keep 
     *      asking the user to upload them).
     */
    getMissingKudsFromCompletedKuds(completedKuds: KudPO[], excludeMissing: boolean = false): MissingKud[] {

        // Get the full list of kuds
        const fullKuds = this.getFullKudsList()

        // Create a map of completed kuds, where the key is the YYYYMM of the kud
        let completedKudsMap = {} as any

        for (let i = 0; i < completedKuds.length; i++) {

            // Check that the KUD has not been signaled as missing
            if (excludeMissing && completedKuds[i].status == KudStatus.missing) {

                this.logger.compute(this.cid, `Kud [${completedKuds[i].kudId}] is MISSING. Excluding.`)

                continue;
            }

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
     * The user signals that a KUD document is missing and cannot be found anywhere 
     * @param kudId the id of the missing kud
     * @param userEmail the user email
     */
    async onKudMissing(kudId: string, userEmail: string) {

        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            this.logger.compute(this.cid, `Updating Game to register Kud Doc Missing`)

            // Update the kud game with a new kud uploaded
            await new KudDocGameStore(db, this.config).onKudMissing(userEmail, kudId);


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