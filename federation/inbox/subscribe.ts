import {
  Announce,
  Create,
  Delete,
  InboxContext,
  Tombstone,
  Update,
} from "@fedify/fedify";
import { getLogger } from "@logtape/logtape";
import {
  deletePersistedPost,
  isPostObject,
  persistPost,
  persistSharedPost,
} from "../../models/post.ts";
import { db } from "../../db.ts";

const logger = getLogger(["hackerspub", "federation", "inbox", "subscribe"]);

export async function onPostCreated(
  fedCtx: InboxContext<void>,
  create: Create,
): Promise<void> {
  logger.debug("On post created: {create}", { create });
  const object = await create.getObject(fedCtx);
  if (!isPostObject(object)) return;
  if (object.attributionId?.href !== create.actorId?.href) return;
  // TODO: visibility
  await persistPost(db, object, {
    replies: true,
    documentLoader: fedCtx.documentLoader,
    contextLoader: fedCtx.contextLoader,
  });
}

export async function onPostUpdated(
  fedCtx: InboxContext<void>,
  update: Update,
): Promise<void> {
  logger.debug("On post updated: {update}", { update });
  const object = await update.getObject(fedCtx);
  if (!isPostObject(object)) return;
  if (object.attributionId?.href !== update.actorId?.href) return;
  await persistPost(db, object, {
    replies: true,
    documentLoader: fedCtx.documentLoader,
    contextLoader: fedCtx.contextLoader,
  });
}

export async function onPostDeleted(
  fedCtx: InboxContext<void>,
  del: Delete,
): Promise<void> {
  logger.debug("On post deleted: {delete}", { delete: del });
  const object = await del.getObject(fedCtx);
  if (
    !(isPostObject(object) || object instanceof Tombstone) ||
    object.id == null || del.actorId == null
  ) {
    return;
  }
  await deletePersistedPost(db, object.id, del.actorId);
}

export async function onPostShared(
  fedCtx: InboxContext<void>,
  announce: Announce,
): Promise<void> {
  logger.debug("On post shared: {announce}", { announce });
  const object = await announce.getObject(fedCtx);
  if (!isPostObject(object)) return;
  if (object.attributionId?.href !== announce.actorId?.href) return;
  await persistSharedPost(db, announce, fedCtx);
}

// TODO: Undo(Announce)
