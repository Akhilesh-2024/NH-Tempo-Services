import Booking from "../models/bookingModel.js";
import Party from "../models/partyModel.js";
import Vehicle from "../models/vehicleModel.js";

// Get Ledger Report
export const getLedgerReport = async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ bookingDate: -1 });
    
    const ledgerData = [];
    
    for (const booking of bookings) {
      // Calculate running balance for each party
      let runningBalance = 0;
      
      // Add debit entry for deal amount
      if (booking.charges.dealAmount > 0) {
        runningBalance += booking.charges.dealAmount;
        ledgerData.push({
          date: booking.bookingDate,
          bookingNo: booking.bookingNo,
          partyName: booking.party.name,
          vehicleNo: booking.vehicle.vehicleNo,
          fromLocation: booking.journey.fromLocation,
          toLocation: booking.journey.toLocation,
          debitAmount: booking.charges.dealAmount,
          creditAmount: 0,
          balance: runningBalance,
          paymentStatus: booking.paymentStatus.partyPaymentStatus,
          remarks: "Deal Amount",
        });
      }
      
      // Add credit entries for payments
      if (booking.charges.paymentHistory && booking.charges.paymentHistory.length > 0) {
        for (const payment of booking.charges.paymentHistory) {
          runningBalance -= payment.amount;
          ledgerData.push({
            date: payment.paymentDate,
            bookingNo: booking.bookingNo,
            partyName: booking.party.name,
            vehicleNo: booking.vehicle.vehicleNo,
            fromLocation: booking.journey.fromLocation,
            toLocation: booking.journey.toLocation,
            debitAmount: 0,
            creditAmount: payment.amount,
            balance: runningBalance,
            paymentStatus: booking.paymentStatus.partyPaymentStatus,
            remarks: `Payment - ${payment.mode}`,
          });
        }
      }
      
      // Add advance payment if exists
      if (booking.charges.advancePaid > 0) {
        runningBalance -= booking.charges.advancePaid;
        ledgerData.push({
          date: booking.bookingDate,
          bookingNo: booking.bookingNo,
          partyName: booking.party.name,
          vehicleNo: booking.vehicle.vehicleNo,
          fromLocation: booking.journey.fromLocation,
          toLocation: booking.journey.toLocation,
          debitAmount: 0,
          creditAmount: booking.charges.advancePaid,
          balance: runningBalance,
          paymentStatus: booking.paymentStatus.partyPaymentStatus,
          remarks: "Advance Payment",
        });
      }
    }
    
    // Sort by date (most recent first)
    ledgerData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.status(200).json(ledgerData);
  } catch (error) {
    console.error("Error fetching ledger report:", error);
    res.status(500).json({ 
      message: "Error fetching ledger report", 
      error: error.message 
    });
  }
};

// Get Vehicle Report
export const getVehicleReport = async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ bookingDate: -1 });
    
    const vehicleData = bookings.map(booking => ({
      date: booking.bookingDate,
      bookingNo: booking.bookingNo,
      vehicleNo: booking.vehicle.vehicleNo,
      ownerName: booking.vehicle.ownerName,
      ownerContact: booking.vehicle.ownerContact,
      vehicleType: booking.vehicle.vehicleType,
      ownership: "Owner", // Default, you might want to get this from vehicle collection
      partyName: booking.party.name,
      fromLocation: booking.journey.fromLocation,
      toLocation: booking.journey.toLocation,
      vehicleCost: booking.vehiclePayment.actualVehicleCost || booking.charges.vehicleCharges || 0,
      advancePaid: booking.vehiclePayment.vehicleAdvance || 0,
      balanceAmount: booking.vehiclePayment.vehicleBalance || 0,
      paymentStatus: booking.paymentStatus.vehiclePaymentStatus,
      deliveryStatus: booking.delivery.status,
      remarks: booking.delivery.remarks || "",
    }));
    
    res.status(200).json(vehicleData);
  } catch (error) {
    console.error("Error fetching vehicle report:", error);
    res.status(500).json({ 
      message: "Error fetching vehicle report", 
      error: error.message 
    });
  }
};

// Get Party-wise Ledger Summary
export const getPartyLedgerSummary = async (req, res) => {
  try {
    const { partyId } = req.params;
    
    const bookings = await Booking.find({ 
      "party.name": partyId 
    }).sort({ bookingDate: -1 });
    
    let totalDebit = 0;
    let totalCredit = 0;
    const transactions = [];
    
    for (const booking of bookings) {
      // Deal amount (debit)
      if (booking.charges.dealAmount > 0) {
        totalDebit += booking.charges.dealAmount;
        transactions.push({
          date: booking.bookingDate,
          bookingNo: booking.bookingNo,
          type: "debit",
          amount: booking.charges.dealAmount,
          description: "Deal Amount",
        });
      }
      
      // Advance payment (credit)
      if (booking.charges.advancePaid > 0) {
        totalCredit += booking.charges.advancePaid;
        transactions.push({
          date: booking.bookingDate,
          bookingNo: booking.bookingNo,
          type: "credit",
          amount: booking.charges.advancePaid,
          description: "Advance Payment",
        });
      }
      
      // Payment history (credit)
      if (booking.charges.paymentHistory) {
        for (const payment of booking.charges.paymentHistory) {
          totalCredit += payment.amount;
          transactions.push({
            date: payment.paymentDate,
            bookingNo: booking.bookingNo,
            type: "credit",
            amount: payment.amount,
            description: `Payment - ${payment.mode}`,
          });
        }
      }
    }
    
    const balance = totalDebit - totalCredit;
    
    res.status(200).json({
      partyId,
      totalDebit,
      totalCredit,
      balance,
      transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
    });
  } catch (error) {
    console.error("Error fetching party ledger summary:", error);
    res.status(500).json({ 
      message: "Error fetching party ledger summary", 
      error: error.message 
    });
  }
};

// Get Vehicle-wise Report Summary
export const getVehicleSummary = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const bookings = await Booking.find({ 
      "vehicle.vehicleNo": vehicleId 
    }).sort({ bookingDate: -1 });
    
    let totalVehicleCost = 0;
    let totalAdvancePaid = 0;
    let totalBalance = 0;
    
    const vehicleTransactions = bookings.map(booking => {
      const vehicleCost = booking.vehiclePayment.actualVehicleCost || booking.charges.vehicleCharges || 0;
      const advancePaid = booking.vehiclePayment.vehicleAdvance || 0;
      const balance = booking.vehiclePayment.vehicleBalance || 0;
      
      totalVehicleCost += vehicleCost;
      totalAdvancePaid += advancePaid;
      totalBalance += balance;
      
      return {
        date: booking.bookingDate,
        bookingNo: booking.bookingNo,
        partyName: booking.party.name,
        fromLocation: booking.journey.fromLocation,
        toLocation: booking.journey.toLocation,
        vehicleCost,
        advancePaid,
        balance,
        paymentStatus: booking.paymentStatus.vehiclePaymentStatus,
        deliveryStatus: booking.delivery.status,
      };
    });
    
    res.status(200).json({
      vehicleId,
      totalVehicleCost,
      totalAdvancePaid,
      totalBalance,
      transactions: vehicleTransactions,
    });
  } catch (error) {
    console.error("Error fetching vehicle summary:", error);
    res.status(500).json({ 
      message: "Error fetching vehicle summary", 
      error: error.message 
    });
  }
};