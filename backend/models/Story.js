import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    mood: {
      type: String,
      required: true,
    },

    characters: [
      {
        name: String,
        voice: String,
      },
    ],

    story: {
      type: String,
      required: true,
    },

    prompt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Story = mongoose.model("Story", storySchema);

export default Story;