import Party from "../models/partyModel.js";

// @desc Get all parties
export const getParties = async (req, res) => {
  try {
    const parties = await Party.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: parties });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// @desc Create a new party
export const createParty = async (req, res) => {
  try {
    const { name, contactNumber, email, city, gstNo } = req.body;

    if (!name || !contactNumber || !email || !city) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields must be filled" });
    }

    const newParty = await Party.create({
      name,
      contactNumber,
      email,
      city,
      gstNo,
    });

    res.status(201).json({ success: true, data: newParty });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// @desc Update a party
export const updateParty = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedParty = await Party.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedParty) {
      return res.status(404).json({ success: false, message: "Party not found" });
    }

    res.status(200).json({ success: true, data: updatedParty });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// @desc Delete a party
export const deleteParty = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedParty = await Party.findByIdAndDelete(id);

    if (!deletedParty) {
      return res.status(404).json({ success: false, message: "Party not found" });
    }

    res.status(200).json({ success: true, message: "Party deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// @desc Delete multiple parties
export const deleteMultipleParties = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No party IDs provided" });
    }

    const result = await Party.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} parties deleted successfully`,
      deletedIds: ids,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};
