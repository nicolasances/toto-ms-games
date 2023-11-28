import moment from "moment-timezone";
import { ControllerConfig } from "../../Config";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { Logger } from "../../logger/TotoLogger";
import { KudDocGameStore } from "../../store/KudDocGameStore";

/**
 * Kud Doc Game 
 * ---------------------
 * This game asks the user to upload DanskeBank's quaterly Kontoudskrift (statement).
 * The user just needs to upload the document. The document will then be parsed, and if valid, the user will be rewwarded with data quality points.
 * ---------------------
 */
export class KudDocGame {

    userEmail: string;
    logger: Logger;
    cid: string | undefined;
    config: ControllerConfig;

    constructor(userContext: UserContext, execContext: ExecutionContext) {

        this.userEmail = userContext.email;
        this.logger = execContext.logger;
        this.cid = execContext.cid;
        this.config = execContext.config as ControllerConfig;

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
            if (curYear >= endYear && curMonth > endMonth) stop = true;

        }

        return kuds
    }

    /**
     * Retrieves the list of kuds that still need to be uploaded for the user in the userContext
     */
    async getMissingKuds() {

        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            // Get the full list of kuds
            const fullKuds = this.getFullKudsList()

            // Get the list of completed kuds
            let completedKuds = await new KudDocGameStore(db, this.config).getKuds(this.userEmail)

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

            return missingKuds

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

export interface KudYearMonth {
    year: number
    month: number
}