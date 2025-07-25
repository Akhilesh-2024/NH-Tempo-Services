import Master from "../models/masterModel.js";

// Create a new master record
export const createMaster = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const existing = await Master.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Record already exists" });
    }

    const master = await Master.create({ name: name.trim() });
    res.status(201).json({ success: true, data: master });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all master records
export const getMasters = async (req, res) => {
  try {
    const masters = await Master.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: masters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single master record by ID
export const getMasterById = async (req, res) => {
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, data: master });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a master record
export const updateMaster = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const updatedMaster = await Master.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedMaster) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, data: updatedMaster });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a master record
export const deleteMaster = async (req, res) => {
  try {
    const master = await Master.findByIdAndDelete(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
