import React, { useEffect, useRef, useState } from 'react'
import { navbarStyles } from '../assets/dummyStyles'
import img1 from '../assets/logo.png'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, User } from 'lucide-react';
import axios from 'axios'

const BASE_URL = 'http://localhost:4000/api'

const Navbar = ({ user: propUser, onLogout }) => {
    const navigate = useNavigate()
    const menuRef = useRef()
    const [menuOpen, setMenuOpen] = useState(false)

    const user = propUser || {
        name: "",
        email: "",
    }

    // fetch the user data from server
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) return

                const response = await axios.get(`${BASE_URL}/user/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const userData = response.data.user || response.data
                setUser(userData)
            } catch (error) {
                console.error('failed to load profile', error);
            }
        }
        if (!propUser) {
            fetchUserData()
        }
    }, [propUser])

    const toggleMenu = () => setMenuOpen((prev) => !prev)

    const handleLogout = () => {
        setMenuOpen(false)
        localStorage.removeItem("token")
        onLogout?.()
        navigate("/login")
    }

    // close toggle manu check outside box
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <header className={navbarStyles.header}>
            <div className={navbarStyles.container}>
                {/* logo */}
                <div onClick={() => Navigate("/")} className={navbarStyles.logoContainer}>
                    <div className={navbarStyles.logoImage}>
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlP8mbGZ8Xjrshpnc-egINEJ1fppD1QOupeQ&s" alt="logo" />
                    </div>
                    <span className={navbarStyles.logoText} >Smartwest Management</span>
                </div>

                {/* user is present */}
                {user && (
                    <div className={navbarStyles.userContainer} ref={menuRef}>
                        <button className={navbarStyles.userButton} onClick={toggleMenu}>
                            <div className='relative'>
                                <div className={navbarStyles.userAvatar}>
                                    {User?.name?.[0]?.toUppercase() || "U"}
                                </div>
                                <div className={navbarStyles.statusIndicator}>
                                </div>
                            </div>
                            <div className={navbarStyles.userTextContainer}>
                                <p className={navbarStyles.userName}>{user?.name || "User"}</p>
                                <p className={navbarStyles.userEmail}>
                                    {user?.email || "user@smartwestmanagement.com"}
                                </p>
                            </div>
                            <ChevronDown className={navbarStyles.chevronIcon(menuOpen)} />
                        </button>

                        {/* dropdown manu */}
                        {menuOpen && (
                            <div className={navbarStyles.dropdownMenu}>
                                <div className={navbarStyles.dropdownHeader}>
                                    <div className='flex items-center gap-3'>
                                        <div className={navbarStyles.dropdownAvatar}>
                                            {user?.name?.[0]?.toUppercase() || "U"}
                                        </div>

                                        <div>
                                            <div className={navbarStyles.dropdownName}>
                                                {user?.name || "User"}
                                            </div>
                                            <div className={navbarStyles.dropdownEmail}>
                                                {user?.email || "smartwestmanagement.com"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={navbarStyles.menuItemContainer}>
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false)
                                            navigate("/profile")
                                        }} className={navbarStyles.menuItem}
                                    >
                                        <User className='w-4 h-4 ' />
                                        <span>My Profile</span>
                                    </button>
                                </div>

                                <div className={navbarStyles.menuItemBorder}>
                                    <button onClick={handleLogout} className={navbarStyles.logoutButton}>
                                        <LogOut className='W-4 H-4' />
                                        <span>Log Out</span>
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                )}
            </div>
        </header >
    )
}

export default Navbar