import React, { Activity, useEffect, useMemo, useState } from 'react'
// import axios from "axios";
import { styles } from '../assets/dummyStyles'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Reports from './Reports'
import { ArrowUp, Car, CarTaxiFront, Clock, CreditCard, DollarSign, Gift, Home, Info, PersonStanding, PiggyBank, RefreshCw, ShoppingCart, TrendingUp, Users, UsersRound, Utensils, Zap } from 'lucide-react'
import { styleEffect } from 'framer-motion'
import { Link, Outlet } from 'react-router-dom'

const API_BASE = 'https://smartwest-management.onrender.com/api'

const CATEGORY_ICONS = {
    Food: <Utensils className="w-4 h-4" />,
    Housing: <Home className="w-4 h-4" />,
    Transport: <Car className="w-4 h-4" />,
    Shopping: <ShoppingCart className="w-4 h-4" />,
    Entertainment: <Gift className="w-4 h-4" />,
    Utilities: <Zap className="w-4 h-4" />,
    Healthcare: <Activity className="w-4 h-4" />,
    Salary: <ArrowUp className="w-4 h-4" />,
    Freelance: <CreditCard className="w-4 h-4" />,
    Savings: <PiggyBank className="w-4 h-4" />,
};

// TO FILTER
const filterTransactions = (transactions, frame) => {
    const now = new Date();
    const today = new Date(now).setHours(0, 0, 0, 0);

    switch (frame) {
        case "daily":
            return transactions.filter((t) => new Date(t.date) >= today);
        case "weekly": {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return transactions.filter((t) => new Date(t.date) >= startOfWeek);
        }
        case "monthly":
            return transactions.filter(
                (t) => new Date(t.date).getMonth() === now.getMonth()
            );
        default:
            return transactions;
    }
};

const safeArrayFromResponse = (res) => {
    const body = res?.data;
    if (!body) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;
    if (Array.isArray(body.incomes)) return body.incomes;
    if (Array.isArray(body.expenses)) return body.expenses;
    return [];
};

const Layout = ({ onLogout, user }) => {

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [timeFrame, setTimeFrame] = useState("monthly");
    const [loading, setLoading] = useState(false);
    const [showAllTransactions, setShowAllTransactions] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // fetch the transaction from the server side
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [incomeRes, expenseRes] = await Promise.all([
                axios.get(`${API_BASE}/income/get`, { headers }),
                axios.get(`${API_BASE}/expense/get`, { headers }),
            ]);

            const incomes = safeArrayFromResponse(incomeRes).map((i) => ({
                ...i,
                type: "income",
            }));
            const expenses = safeArrayFromResponse(expenseRes).map((e) => ({
                ...e,
                type: "expense",
            }));

            const allTransactions = [...incomes, ...expenses]
                .map((t) => ({
                    id: t._id || t.id || t.id_str || Math.random().toString(36).slice(2),
                    description: t.description || t.title || t.note || "",
                    amount: t.amount != null ? Number(t.amount) : Number(t.value) || 0,
                    date: t.date || t.createdAt || new Date().toISOString(),
                    category: t.category || t.type || "Other",
                    type: t.type,
                    raw: t,
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            setTransactions(allTransactions);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(
                "Failed to fetch transactions",
                err?.response || err.message || err
            );
        } finally {
            setLoading(false);
        }
    };

    // to addTransaction 
    const addTransaction = async (transaction) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const endpoint =
                transaction.type === "income" ? "income/add" : "expense/add";
            await axios.post(`${API_BASE}/${endpoint}`, transaction, { headers });
            await fetchTransactions();
            return true;
        } catch (err) {
            console.error(
                "Failed to add transaction",
                err?.response || err.message || err
            );
            throw err;
        }
    };

    // to update any transition
    const editTransaction = async (id, transaction) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const endpoint =
                transaction.type === "income" ? "income/update" : "expense/update";
            await axios.put(`${API_BASE}/${endpoint}/${id}`, transaction, {
                headers,
            });
            await fetchTransactions();
            return true;
        } catch (err) {
            console.error(
                "Failed to edit transaction",
                err?.response || err.message || err
            );
            throw err;
        }
    };

    const deleteTransaction = async (id, type) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const endpoint = type === "income" ? "income/delete" : "expense/delete";
            await axios.delete(`${API_BASE}/${endpoint}/${id}`, { headers });
            await fetchTransactions();
            return true;
        } catch (err) {
            console.error(
                "Failed to delete transaction",
                err?.response || err.message || err
            );
            throw err;
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = useMemo(
        () => filterTransactions(transactions, timeFrame),
        [transactions, timeFrame]
    ); //filter with timeframe

    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const last30DaysTransactions = transactions.filter(
            (t) => new Date(t.date) >= thirtyDaysAgo
        );

        const last30DaysIncome = last30DaysTransactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const last30DaysExpenses = last30DaysTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const allTimeIncome = transactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const allTimeExpenses = transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const savingsRate =
            last30DaysIncome > 0
                ? Math.round(
                    ((last30DaysIncome - last30DaysExpenses) / last30DaysIncome) * 100
                )
                : 0;

        const last60DaysAgo = new Date(now);
        last60DaysAgo.setDate(now.getDate() - 60);

        const previous30DaysTransactions = transactions.filter((t) => {
            const date = new Date(t.date);
            return date >= last60DaysAgo && date < thirtyDaysAgo;
        });

        const previous30DaysExpenses = previous30DaysTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenseChange =
            previous30DaysExpenses > 0
                ? Math.round(
                    ((last30DaysExpenses - previous30DaysExpenses) /
                        previous30DaysExpenses) *
                    100
                )
                : 0;

        return {
            totalTransactions: transactions.length,
            last30DaysIncome,
            last30DaysExpenses,
            last30DaysSavings: last30DaysIncome - last30DaysExpenses,
            allTimeIncome,
            allTimeExpenses,
            allTimeSavings: allTimeIncome - allTimeExpenses,
            last30DaysCount: last30DaysTransactions.length,
            savingsRate,
            expenseChange,
        };
    }, [transactions]);

    const timeFrameLabel = useMemo(
        () =>
            timeFrame === "daily"
                ? "Today"
                : timeFrame === "weekly"
                    ? "This Week"
                    : "This Month",
        [timeFrame]
    );

    const outletContext = {
        transactions: filteredTransactions,
        addTransaction,
        editTransaction,
        deleteTransaction,
        refreshTransactions: fetchTransactions,
        timeFrame,
        setTimeFrame,
        lastUpdated,
    };

    const getSavingsRating = (rate) =>
        rate > 30 ? "Excellent" : rate > 20 ? "Good" : "Needs improvement";

    //for filter using category
    const topCategories = useMemo(
        () =>
            Object.entries(
                transactions
                    .filter((t) => t.type === "expense")
                    .reduce((acc, t) => {
                        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                        return acc;
                    }, {})
            )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
        [transactions]
    );

    const displayedTransactions = showAllTransactions
        ? transactions
        : transactions.slice(0, 4);

    return (
        <div className={styles.layout.root}>
            <Navbar user={user} onLogout={onLogout} />

            <Sidebar
                user={user}
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
            />

            <div className={styles.layout.mainContainer(sidebarCollapsed)}>
                <div className={styles.header.container}>
                    <div>
                        <h1 className={styles.header.title}>Dashboard</h1>
                        <p className={styles.header.subtitle}>Walcome Back</p>
                    </div>
                </div>
            </div>


            <div className={styles.statCards.grid}>

                {/* users */}
                <div className={styles.statCards.card}>
                    <div className={styles.statCards.cardHeader}>
                        <div>
                            <p className={styles.statCards.cardTitle}>Users</p>
                            <p className={styles.statCards.cardValue}>
                                $
                                {stats.allTimeSavings.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className={styles.statCards.iconContainer("teal")}>
                            <Users />
                        </div>
                    </div>
                </div>

                {/* drivers */}
                <div className={styles.statCards.card}>
                    <div className={styles.statCards.cardHeader}>
                        <div>
                            <p className={styles.statCards.cardTitle}>Drivers</p>
                            <p className={styles.statCards.cardValue}>
                                $
                                {stats.allTimeSavings.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className={styles.statCards.iconContainer("teal")}>
                            <Car />
                        </div>
                    </div>
                </div>

                {/* customers */}
                <div className={styles.statCards.card}>
                    <div className={styles.statCards.cardHeader}>
                        <div>
                            <p className={styles.statCards.cardTitle}>Customers</p>
                            <p className={styles.statCards.cardValue}>
                                $
                                {stats.allTimeSavings.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className={styles.statCards.iconContainer("teal")}>
                            <PersonStanding />
                        </div>
                    </div>
                </div>

                {/* vahicles */}
                <div className={styles.statCards.card}>
                    <div className={styles.statCards.cardHeader}>
                        <div>
                            <p className={styles.statCards.cardTitle}>Vahicles</p>
                            <p className={styles.statCards.cardValue}>
                                $
                                {stats.allTimeSavings.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className={styles.statCards.iconContainer("teal")}>
                            <CarTaxiFront />
                        </div>
                    </div>
                </div>

                {/* total process till now */}
                <div className={styles.statCards.card}>
                    <div className={styles.statCards.cardHeader}>
                        <div>
                            <p className={styles.statCards.cardTitle}>Total Process Till Now</p>
                            <p className={styles.statCards.cardValue}>
                                $
                                {stats.allTimeSavings.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className={styles.statCards.iconContainer("teal")}>
                            <CarTaxiFront />
                        </div>
                    </div>
                </div>

                {/* Todays Process */}
                <div className={styles.statCards.card}>
                    <div className={styles.statCards.cardHeader}>
                        <div>
                            <p className={styles.statCards.cardTitle}>Todays Process</p>
                            <p className={styles.statCards.cardValue}>
                                $
                                {stats.allTimeSavings.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className={styles.statCards.iconContainer("teal")}>
                            <CarTaxiFront />
                        </div>
                    </div>
                </div>

                {/* Weekly Process */}
                <div className={styles.statCards.card}>
                    <div className={styles.statCards.cardHeader}>
                        <div>
                            <p className={styles.statCards.cardTitle}>Weekly Process</p>
                            <p className={styles.statCards.cardValue}>
                                $
                                {stats.allTimeSavings.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className={styles.statCards.iconContainer("teal")}>
                            <CarTaxiFront />
                        </div>
                    </div>
                </div>

                {/* monthly process */}
                <div className={styles.statCards.card}>
                    <div className={styles.statCards.cardHeader}>
                        <div>
                            <p className={styles.statCards.cardTitle}>Monthly Process</p>
                            <p className={styles.statCards.cardValue}>
                                $
                                {stats.allTimeSavings.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div className={styles.statCards.iconContainer("teal")}>
                            <CarTaxiFront />
                        </div>
                    </div>
                </div>

                {/*  Financial Overview */}
                <div className={styles.grid.main}>
                    <div className={styles.grid.leftColumn}>
                        <div className={styles.cards.base}>
                            <div className={styles.cards.header}>
                                <h3 className={styles.cards.title}>
                                    <TrendingUp className='w-6 h-6 text-teal-500' />
                                    Financial Overview
                                    <span className='text-sm text-gray-500 font-normal'>
                                        ({timeFrameLabel})
                                    </span>
                                </h3>
                            </div>
                            <Outlet context={outletContext} />
                        </div>
                    </div>

                    {/*right side*/}
                    <div className={styles.grid.main}>
                        <div className={styles.grid.rightColumn}>
                            <div className={styles.cards.base}>
                                <div className={styles.transactions.cardHeader}>
                                    <h3 className={styles.transactions.cardTitle}>
                                        <Clock className='w-6 h-6 text-purple-500' />
                                        Recent Transactions
                                    </h3>
                                    <button onClick={fetchTransactions} disabled={loading}
                                        className={styles.transactions.refreshButton}>
                                        <RefreshCw className={styles.transactions.refreshIcon(loading)} />
                                    </button>
                                </div>
                                <div className={styles.transactions.dataStackingInfo}>
                                    <Info className={styles.transactions.dataStackingInfo} />
                                    <span>Transection are stacked by date (newest first)</span>
                                </div>
                                <div className={styles.transactions.listContainer}>
                                    {displayedTransactions.map((transactions) => {
                                        const { id, type, category, description, date, amount } = transactions
                                        return (
                                            <div key={id} className={styles.transactions.transactionItem}>
                                                <div className='flex items-center gap-1 md:gap-4 lg:gap-3'>
                                                    <div className=''>

                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Reports user={user} onLogout={onLogout} />
        </div >
    )
}

export default Layout   
