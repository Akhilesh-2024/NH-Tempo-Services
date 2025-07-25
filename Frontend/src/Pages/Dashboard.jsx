import React, { useState, useEffect } from "react";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import DashboardContent from "../Components/DashboardContent";
import ProfileEditPage from "../Components/ProfileEditPage";
import AdminMaster from "../Components/Main/AdminMaster";
import AdminPartyForm from "../Components/Main/AdminPartyForm";
import AdminPartyList from "../Components/Main/AdminPartyList";
import AdminVehicleForm from "../Components/Main/AdminVehicleForm";
import AdminVehicleList from "../Components/Main/AdminVehicleList";
import AdminBookingFormImproved from "../Components/Main/AdminBookingFormImproved";
import AdminBookingList from "../Components/Main/AdminBookingList";

// --- NEW IMPORTS ---
import PartyPending from "../Components/Main/PartyPending";
import VehiclePending from "../Components/Main/VehiclePending";
import DeliveryPending from "../Components/Main/DeliveryPending";

// --- REPORT IMPORTS ---
import LedgerReport from "../Components/Main/LedgerReport";
import VehicleReport from "../Components/Main/VehicleReport";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editBookingId, setEditBookingId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarExpanded(false);
        setIsSidebarOpen(false);
      } else {
        setIsSidebarExpanded(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTabChange = (tab, bookingId = null) => {
    setActiveTab(tab);
    if (tab === "edit-booking" && bookingId) {
      setEditBookingId(bookingId);
    } else if (tab !== "edit-booking") {
      setEditBookingId(null);
    }
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleProfileClick = () => {
    setActiveTab("edit-profile");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "edit-profile":
        return <ProfileEditPage />;
      case "dashboard":
        return <DashboardContent setActiveTab={handleTabChange} />; // Pass setActiveTab
      case "master":
        return <AdminMaster />;
      // Party
      case "party":
      case "add-party":
        return <AdminPartyForm setActiveTab={handleTabChange} />;
      case "list-party":
        return <AdminPartyList setActiveTab={handleTabChange} />;
      // Vehicle
      case "vehicle":
      case "add-vehicle":
        return <AdminVehicleForm setActiveTab={handleTabChange} />;
      case "list-vehicle":
        return <AdminVehicleList setActiveTab={handleTabChange} />;
      // Booking
      case "booking":
      case "add-booking":
        return <AdminBookingFormImproved setActiveTab={handleTabChange} />;
      case "list-booking":
        return <AdminBookingList setActiveTab={handleTabChange} />;
      case "edit-booking":
        return (
          <AdminBookingFormImproved
            setActiveTab={handleTabChange}
            editMode={true}
            editBookingId={editBookingId}
          />
        );

      // --- NEW CASES ---
      case "pending":
        return <PartyPending />;
      case "party-pending":
        return <PartyPending />;
      case "vehicle-pending":
        return <VehiclePending />;
      case "delivery-pending":
        return <DeliveryPending />;

      // --- REPORT CASES ---
      case "reports":
        return <LedgerReport />;
      case "ledger-report":
        return <LedgerReport />;
      case "vehicle-report":
        return <VehicleReport />;

      default:
        return <DashboardContent setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onProfileClick={handleProfileClick}
      />
      <div className="flex relative">
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
        />
        <main
          className={`flex-1 min-h-screen bg-gray-50 dark:bg-gray-800 transition-all duration-300 ease-in-out w-full
            ${!isMobile ? (isSidebarExpanded ? "ml-72" : "ml-20") : "ml-0"}
          `}
        >
          <div className="w-full h-full">{renderContent()}</div>
        </main>
      </div>
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
