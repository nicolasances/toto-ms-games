import { Request } from "express";
import { Storage } from "@google-cloud/storage";
import { EVENTS, EventPublisher } from "../../../evt/EventPublisher";
import { KuploadGame, kudId } from "../../../games/kud/KuploadGame";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

const storage = new Storage();


/**
 * This Delegate allows the user to post a KUD document
 */
export class PostKudDocument implements TotoDelegate {

  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const logger = execContext.logger;
    const cid = execContext.cid;

    const gamesDataBucket = process.env.GAMES_DATA_BUCKET;
    const uploadFilepath = req.body.filepath;
    const year = req.body.year;
    const month = req.body.month;

    logger.compute(cid, `User ${userContext.email} is uploading a KUD [year: ${year}, month: ${month}]. Temporary storage: ${uploadFilepath}`, "info");

    // Validation
    if (!userContext.email) throw new ValidationError(400, "No user found in the context. Check Auth token.")
    if (!year) throw new ValidationError(400, "No Year provided");
    if (!month) throw new ValidationError(400, "No Month provided");

    try {

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
      await new KuploadGame(userContext, execContext, String(extractAuthHeader(req))).onKudUploaded(kudId(parseInt(year), parseInt(month)), userContext.email)

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
    }
  }
}

interface Filter {
  maxResults?: number,
  user?: string
}