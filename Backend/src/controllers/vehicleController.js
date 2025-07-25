import Vehicle from "../models/vehicleModel.js";

// Get all vehicles
export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching vehicles", error: error.message });
  }
};

// Create a new vehicle
export const createVehicle = async (req, res) => {
  try {
    const newVehicle = new Vehicle(req.body);
    await newVehicle.save();
    res.status(201).json({ success: true, message: "Vehicle created successfully", data: newVehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating vehicle", error: error.message });
  }
};

// Update a vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedVehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }
    res.status(200).json({ success: true, message: "Vehicle updated successfully", data: updatedVehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error updating vehicle", error: error.message });
  }
};

// Delete a single vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVehicle = await Vehicle.findByIdAndDelete(id);
    if (!deletedVehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }
    res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting vehicle", error: error.message });
  }
};

// Delete multiple vehicles
export const deleteMultipleVehicles = async (req, res) => {
  try {
    const { ids } = req.body; // Expect an array of IDs
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: "Invalid request, IDs array required" });
    }

    await Vehicle.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ success: true, message: "Vehicles deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting vehicles", error: error.message });
  }
};
