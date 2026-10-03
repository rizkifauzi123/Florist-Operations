import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, X, Check, ArrowRight } from "lucide-react";
import "../../Style/Common/DateRangeFilter.css";

const formatDateDisplay = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const DateRangeFilter = ({
  singleDate = "",
  startDate = "",
  endDate = "",
  onApply,
  onReset,
  theme = "blue", // "blue" | "pink"
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(startDate || endDate ? "range" : "single");
  const [tempSingle, setTempSingle] = useState(singleDate);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const containerRef = useRef(null);

  // Sync saat prop luar berubah
  useEffect(() => {
    setTempSingle(singleDate);
    setTempStart(startDate);
    setTempEnd(endDate);
    if (startDate || endDate) {
      setActiveTab("range");
    } else if (singleDate) {
      setActiveTab("single");
    }
  }, [singleDate, startDate, endDate]);

  // Click outside to close
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const hasFilterActive = Boolean(singleDate || (startDate && endDate));

  const getLabel = () => {
    if (startDate && endDate) {
      return `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`;
    }
    if (singleDate) {
      return formatDateDisplay(singleDate);
    }
    return "Semua Tanggal";
  };

  const handleApply = () => {
    if (activeTab === "single") {
      onApply({ mode: "single", singleDate: tempSingle, startDate: "", endDate: "" });
    } else {
      if (tempStart && !tempEnd) {
        onApply({ mode: "range", singleDate: "", startDate: tempStart, endDate: tempStart });
      } else if (!tempStart && tempEnd) {
        onApply({ mode: "range", singleDate: "", startDate: tempEnd, endDate: tempEnd });
      } else {
        onApply({ mode: "range", singleDate: "", startDate: tempStart, endDate: tempEnd });
      }
    }
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setTempSingle("");
    setTempStart("");
    setTempEnd("");
    onReset();
    setOpen(false);
  };

  const isPink = theme === "pink";

  return (
    <div className="drf-container" ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        className={`drf-trigger ${open ? "open" : ""} ${hasFilterActive ? "active-filter" : ""} ${isPink ? "birthday-theme" : ""}`}
        onClick={() => setOpen((p) => !p)}
      >
        <Calendar size={13} className="drf-trigger-icon" />
        <span className="drf-trigger-text">{getLabel()}</span>
        {hasFilterActive ? (
          <span
            className="drf-clear-btn"
            onClick={handleClear}
            title="Hapus filter tanggal"
          >
            <X size={13} />
          </span>
        ) : (
          <ChevronDown size={13} className={`drf-chevron ${open ? "rotated" : ""}`} />
        )}
      </button>

      {/* POPOVER DROPDOWN */}
      {open && (
        <div className="drf-popover" onClick={(e) => e.stopPropagation()}>
          {/* TABS */}
          <div className="drf-tabs">
            <button
              type="button"
              className={`drf-tab-btn ${activeTab === "single" ? (isPink ? "birthday-active" : "active") : ""}`}
              onClick={() => setActiveTab("single")}
            >
              Satu Tanggal
            </button>
            <button
              type="button"
              className={`drf-tab-btn ${activeTab === "range" ? (isPink ? "birthday-active" : "active") : ""}`}
              onClick={() => setActiveTab("range")}
            >
              Rentang Tanggal
            </button>
          </div>

          {/* BODY */}
          <div className="drf-body">
            {activeTab === "single" ? (
              <div className="drf-input-group">
                <label className="drf-input-label">Pilih Tanggal</label>
                <input
                  type="date"
                  className={`drf-date-input ${isPink ? "birthday-focus" : ""}`}
                  value={tempSingle}
                  onChange={(e) => setTempSingle(e.target.value)}
                />
              </div>
            ) : (
              <div className="drf-range-grid">
                <div className="drf-input-group">
                  <label className="drf-input-label">Dari</label>
                  <input
                    type="date"
                    className={`drf-date-input ${isPink ? "birthday-focus" : ""}`}
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                  />
                </div>
                <div className="drf-input-group">
                  <label className="drf-input-label">Sampai</label>
                  <input
                    type="date"
                    className={`drf-date-input ${isPink ? "birthday-focus" : ""}`}
                    value={tempEnd}
                    min={tempStart || undefined}
                    onChange={(e) => setTempEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="drf-actions">
            <button
              type="button"
              className="drf-btn-reset"
              onClick={handleClear}
            >
              Reset
            </button>
            <button
              type="button"
              className={`drf-btn-apply ${isPink ? "birthday-apply" : ""}`}
              onClick={handleApply}
            >
              <Check size={13} /> Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
