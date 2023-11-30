import { Request } from "express";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { ControllerConfig } from "../../../Config";
import { ValidationError } from "../../../controller/validation/Validator";
import { TotoRuntimeError } from "../../../controller/model/TotoRuntimeError";
import { Storage } from "@google-cloud/storage";
import { EVENTS, EventPublisher } from "../../../evt/EventPublisher";
import { KudDocGame, kudId } from "../../../games/kud/KudDocGame";

const storage = new Storage();


/**
 * This Delegate allows the user to post a KUD document
 */
export class PostKudDocument implements TotoDelegate {

  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const logger = execContext.logger;
    const cid = execContext.cid;
    const config = execContext.config as ControllerConfig;

    const gamesDataBucket = process.env.GAMES_DATA_BUCKET;
    const uploadFilepath = req.body.filepath;
    const year = req.body.year;
    const month = req.body.month;

    logger.compute(cid, `User ${userContext.email} is uploading a KUD [year: ${year}, month: ${month}]. Temporary storage: ${uploadFilepath}`, "info");

    // Validation
    if (!userContext.email) throw new ValidationError(400, "No user found in the context. Check Auth token.")
    if (!year) throw new ValidationError(400, "No Year provided");
    if (!month) throw new ValidationError(400, "No Month provided");

    let client;

    try {

      client = await config.getMongoClient();
      const db = client.db(config.getDBName());

      logger.compute(cid, `Kud will be stored to bucket [${gamesDataBucket}]`);

      // Get the Bucket
      const bucket = storage.bucket(String(gamesDataBucket));

      // Determine the filename
      const dir = "kuds";
      const filename = `kud-${year}.${month}.pdf`;
      const filepath = `${dir}/${filename}`

      // Delete any old file in the bucket
      await bucket.file(filepath).delete({ ignoreNotFound: true })

      // Save the new file
      await bucket.upload(uploadFilepath, { destination: filepath });

      // Save the Game
      await new KudDocGame(userContext, execContext).onKudUploaded(kudId(parseInt(year), parseInt(month)), userContext.email)

      // Publish event on pubsub
      await new EventPublisher(execContext, "games").publishEvent(filename, EVENTS.kudUploaded, `Kud ${filename} uploaded`, { gcsFilepath: filepath, gcsBucket: gamesDataBucket, year: year, month: month, user: userContext.email })

      return { uploaded: true, destinationFilepath: filepath }

    } catch (error) {

      logger.compute(cid, `${error}`, "error")

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

interface Filter {
  maxResults?: number,
  user?: string
}