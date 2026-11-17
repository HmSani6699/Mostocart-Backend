import { Setting } from "../models/Setting.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const update = req.body;
    const settings = await Setting.updateSettings(update);
    res.json({ success: true, data: settings, message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

