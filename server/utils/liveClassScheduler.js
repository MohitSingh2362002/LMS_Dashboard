import LiveClass from "../models/LiveClass.js";

export const activateDueLiveClasses = async (io) => {
  const now = new Date();

  const dueClasses = await LiveClass.find({
    status: "scheduled",
    scheduledAt: { $lte: now }
  });

  if (!dueClasses.length) {
    return [];
  }

  const updatedIds = dueClasses.map((liveClass) => liveClass._id);

  await LiveClass.updateMany(
    { _id: { $in: updatedIds } },
    {
      $set: {
        status: "live",
        isImmediate: false
      }
    }
  );

  const activatedClasses = await LiveClass.find({ _id: { $in: updatedIds } })
    .populate("instructor", "name email avatar")
    .populate("course", "title");

  if (io) {
    activatedClasses.forEach((liveClass) => {
      io.emit("live-class:started", liveClass);
    });
  }

  return activatedClasses;
};
