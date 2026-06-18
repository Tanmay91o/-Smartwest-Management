import React, { useEffect, useMemo, useState } from 'react'
import { dashboardStyles, trendStyles, chartStyles } from '../assets/dummyStyles'
import { GAUGE_COLORS, EXPENSE_CATEGORY_ICONS, COLORS, INCOME_CATEGORY_ICONS } from "../assets/color"
import { useOutletContext } from 'react-router-dom'
import axios from 'axios'
import { calculateData, getPreviousTimeFrameRange, getTimeFrameRange } from '../components/Helpers'
import { Plus, Wallet } from 'lucide-react'
import { frame } from 'framer-motion'
import FinancialCard from '../components/FinancialCard'

const API_BASE = 'https://smartwest-management.onrender.com/api'

const getAuthHeader = () => {
    const token =
        localStorage.getItem("token") || localStorage.getItem("authToken")
    return token ? { Authorization: `Bearer $(token)` } : {}
}

// to convert date iso timeline
function toIsoWithClientTime(dateValue) {
    if (!dateValue) {
        return new Date().toISOString();
    }

    if (typeof dateValue === "string" && dateValue.length === 10) {
        const now = new Date();
        const hhmmss = now.toTimeString().slice(0, 8);
        const combined = new Date(`${dateValue}T${hhmmss}`);
        return combined.toISOString();
    }

    try {
        return new Date(dateValue).toISOString();
    } catch (err) {
        return new Date().toISOString();
    }
}

const Dashboard = () => {
    //to refresh transection from outlet context
    const {
        transactions: outletTransactions = [],
        timeFrame = "monthly",
        setTimeFrame = () => { },
        refreshTransactions
    } = useOutletContext();

    const [showModal, setShowModal] = useState(false);
    const [gaugeData, setGaugeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [overviewMeta, setOverviewMeta] = useState({});
    const [showAllIncome, setShowAllIncome] = useState(false); //to toggle
    const [showAllExpense, setShowAllExpense] = useState(false);

    const [newTransaction, setNewTransaction] = useState({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",//or income
        category: "Food",
    });

    const timeFrameRange = useMemo(() => getTimeFrameRange(timeFrame), [timeFrame]);
    const prevTimeFrameRange = useMemo(() => getPreviousTimeFrameRange(timeFrame), [timeFrame]);

    const isDateInRange = (date, start, end) => {
        const transactionDate = new Date(date);
        const startDate = new Date(start);
        const endDate = new Date(end);
        transactionDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return transactionDate >= startDate && transactionDate <= endDate;
    };

    //to filter using date and time
    const filteredTransactions = useMemo(
        () => (outletTransactions || []).filter((t) =>
            isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end)
        ),
        [outletTransactions, timeFrameRange]
    );

    const prevFilteredTransactions = useMemo(
        () => (outletTransactions || []).filter((t) =>
            isDateInRange(t.date, prevTimeFrameRange.start, prevTimeFrameRange.end)
        ),
        [outletTransactions, prevTimeFrameRange]
    );

    //calculate data
    const currentTimeFrameData = useMemo(() => {
        const data = calculateData(filteredTransactions);
        data.savings = data.income - data.expenses;
        return data;
    }, [filteredTransactions]);

    const prevTimeFrameData = useMemo(() => {
        const data = calculateData(prevFilteredTransactions);
        data.savings = data.income - data.expenses;
        return data;
    }, [prevFilteredTransactions]);

    //update the gauge when time frame change
    useEffect(() => {
        const maxValues = {
            income: Math.max(currentTimeFrameData.income, 5000),
            expenses: Math.max(currentTimeFrameData.expenses, 3000),
            savings: Math.max(Math.abs(currentTimeFrameData.savings), 2000),
        };

        setGaugeData([
            { name: "Income", value: currentTimeFrameData.income, max: maxValues.income },
            { name: "Spent", value: currentTimeFrameData.expenses, max: maxValues.expenses },
            { name: "Savings", value: currentTimeFrameData.savings, max: maxValues.savings },
        ]);
    }, [currentTimeFrameData, timeFrame]);//graph fill according to data

    const displayIncome =
        timeFrame === "monthly" && typeof overviewMeta.monthlyIncome === "number"
            ? overviewMeta.monthlyIncome
            : currentTimeFrameData.income;

    const displayExpenses =
        timeFrame === "monthly" && typeof overviewMeta.monthlyExpense === "number"
            ? overviewMeta.monthlyExpense
            : currentTimeFrameData.expenses;

    const displaySavings =
        timeFrame === "monthly" && typeof overviewMeta.savings === "number"
            ? overviewMeta.savings
            : currentTimeFrameData.savings;

    //exchange percentage
    const expenseChange = useMemo(() => {
        const prev = prevTimeFrameData.expenses;
        const curr = displayExpenses;
        if (!prev) {
            if (!curr) return 0;
            return 100;
        }
        return Math.round(((curr - prev) / prev) * 100);
    }, [prevTimeFrameData, displayExpenses]);

    //expense distribution
    const financialOverviewData = useMemo(() => {
        if (
            timeFrame === "monthly" &&
            overviewMeta.expenseDistribution &&
            Array.isArray(overviewMeta.expenseDistribution) &&
            overviewMeta.expenseDistribution.length > 0
        ) {
            return overviewMeta.expenseDistribution.map((d) => ({
                name: d.category,
                value: Math.round(Number(d.amount) || 0),
            }));
        }

        const categories = {};
        filteredTransactions.forEach((transaction) => {
            if (transaction.type === "expense") {
                categories[transaction.category] =
                    (categories[transaction.category] || 0) + transaction.amount;
            }
        });

        return Object.keys(categories).map((category) => ({
            name: category,
            value: Math.round(categories[category]),
        }));
    }, [filteredTransactions, overviewMeta, timeFrame]);

    //build server provided recent list
    const serverRecent = overviewMeta.recentTransactions || [];
    const serverRecentIncome = serverRecent
        .filter((t) => t.type === "income")
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    const serverRecentExpense = serverRecent
        .filter((t) => t.type === "expense")
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const incomeTransactions = useMemo(
        () => filteredTransactions
            .filter((t) => t.type === "income")
            .sort((a, b) => new Date(b.date) - new Date(a.date)),
        [filteredTransactions]
    );

    const expenseTransactions = useMemo(
        () => filteredTransactions
            .filter((t) => t.type === "expense")
            .sort((a, b) => new Date(b.date) - new Date(a.date)),
        [filteredTransactions]
    );

    const incomeListForDisplay =
        timeFrame === "monthly" && serverRecentIncome.length > 0
            ? serverRecentIncome
            : incomeTransactions;

    const expenseListForDisplay =
        timeFrame === "monthly" && serverRecentExpense.length > 0
            ? serverRecentExpense
            : expenseTransactions;

    const displayedIncome = showAllIncome
        ? incomeListForDisplay
        : incomeListForDisplay.slice(0, 3);

    const displayedExpense = showAllExpense
        ? expenseListForDisplay
        : expenseListForDisplay.slice(0, 3);

    //fetch server-side data
    const fetchDashboardOverview = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${API_BASE}/dashboard`, {
                headers: getAuthHeader(),
            })
            if (res?.data?.success) {
                const data = res.data.data
                const recent = (data.recentTransactions || []).map((item) => {
                    const typeFromServer =
                        item.type || (item.category ? "expense" : "income");
                    const amountNum = Number(item.amount) || 0;

                    const isoDate = item.date
                        ? new Date(item.date).toISOString()
                        : item.createdAt
                            ? new Date(item.createdAt).toISOString()
                            : new Date().toISOString();

                    return {
                        id: item._id || item.id || Date.now() + Math.random(),
                        date: isoDate,
                        description:
                            item.description ||
                            item.note ||
                            item.title ||
                            (typeFromServer === "income"
                                ? item.source || "Income"
                                : item.category || "Expense"),
                        amount: amountNum,
                        type: typeFromServer,
                        category:
                            item.category ||
                            (typeFromServer === "income" ? "Salary" : "Other"),
                        raw: item,
                    };
                });

                setOverviewMeta((prev) => ({
                    ...prev,
                    monthlyIncome: Number(data.monthlyIncome || 0),
                    monthlyExpense: Number(data.monthlyExpense || 0),
                    savings:
                        typeof data.savings !== "undefined"
                            ? Number(data.savings)
                            : Number(data.monthlyIncome || 0) - Number(data.monthlyExpense || 0),
                    savingsRate:
                        typeof data.savingsRate !== "undefined" ? data.savingsRate : null,
                    spendByCategory: data.spendByCategory || {},
                    expenseDistribution: data.expenseDistribution || [],
                    recentTransactions: recent,
                }));

                if (timeFrame === "monthly") {
                    const monthlyIncome = Number(data.monthlyIncome || 0);
                    const monthlyExpense = Number(data.monthlyExpense || 0);
                    const savings =
                        typeof data.savings !== "undefined"
                            ? Number(data.savings)
                            : monthlyIncome - monthlyExpense;

                    const maxValues = {
                        income: Math.max(monthlyIncome, 5000),
                        expenses: Math.max(monthlyExpense, 3000),
                        savings: Math.max(Math.abs(savings), 2000),
                    };

                    setGaugeData([
                        { name: "Income", value: monthlyIncome, max: maxValues.income },
                        { name: "Spent", value: monthlyExpense, max: maxValues.expenses },
                        { name: "Savings", value: savings, max: maxValues.savings },
                    ]);
                }
            } else {
                console.warn("Dashboard endpoint returned success:false", res?.data);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard overview:",
                err?.response || err.message || err);
        } finally {
            setLoading(false)
        }
    };
    useEffect(() => {
        fetchDashboardOverview()
    }, [])

    //add edit delete
    const handleTransactions = async () => {
        if (!newTransaction.description || !newTransaction.amount) return

        const payload = {
            date: toIsoWithClientTime(newTransaction.date),
            description: newTransaction.description,
            amount: parseFloat(newTransaction.amount),
            category: newTransaction.category
        }
        try {
            setLoading(true)
            if (newTransaction.type === "income") {
                await axios.post(`${API_BASE}/income/add`, payload, {
                    headers: getAuthHeader(),
                })
            } else {
                await axios.post(`${API_BASE}/expense/add`, payload, {
                    headers: getAuthHeader(),
                })
            }
            await refreshTransactions()
            await fetchDashboardOverview()

            setnewTransaction({
                date: new Date().toISOString().split("T")[0],
                description: "",
                amount: "",
                type: "expense",
                category: "Food",
            }); setShowModal(false)
        } catch (err) {
            console.error("Failed to add Transactions:", err?.response || err.message || err);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={dashboardStyles.container}>
            <div className={dashboardStyles.headerContainer}>
                <div className={dashboardStyles.headerContent}>
                    <div>
                        <h1 className={dashboardStyles.headerTitle}>
                            Management Dashboard
                        </h1>
                        {/* <p className={dashboardStyles.headerSubtitle}>
                            Track your income
                        </p> */}
                    </div>
                    <button onClick={() => setShowModal(true)} className={dashboardStyles.addButton}>
                        <Plus size={20} />
                        Add Transaction
                    </button>
                </div>
                <div className={dashboardStyles.timeFrameContainer}>
                    <div className={dashboardStyles.timeFrameWrapper}>
                        {["daily", "weekly", "monthly"].map((frame) => {
                            <button key={frame} onClick={() => setTimeFrame(frame)}
                                className={dashboardStyles.timeFrameButton(timeFrame === frame)}
                            >
                                {frame.charAt(0).toUpperCase() + frame.slice(1)}
                            </button>
                        })}
                    </div>
                </div>
            </div>
            <div className={dashboardStyles.summaryGrid}>
                <FinancialCard icon={
                    <div className={dashboardStyles.walletIconContainer}>
                        <Wallet className='w-5 h-5 text-teal-700' />
                    </div>
                } label="Total Balance" value={`$${Math.round(displayIncome - displayExpenses).toLocaleString()}`}
                    additionalContent={
                        <div className=" flex items-center gap-2 mt-2 text-sm">
                            <span className={dashboardStyles.balanceBadge}>
                                +${Math.round(displayIncome).toLocaleString()}
                            </span>
                            <span className={dashboardStyles.expenseBadge}>
                                -${Math.round(displayExpenses).toLocaleString()}
                            </span>
                        </div>
                    } />

            </div>
        </div>
    )
}

export default Dashboard
