package com.esta.connect.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContactPhone
import androidx.compose.material.icons.filled.Dialpad
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String) {
    // Auth
    data object Login : Screen("login")
    data object QrScan : Screen("qr_scan")

    // Main (bottom nav)
    data object Home : Screen("home")
    data object Contacts : Screen("contacts")
    data object Dial : Screen("dial")
    data object History : Screen("history")
    data object Profile : Screen("profile")

    // Call screens (full-screen overlays)
    data object IncomingCall : Screen("incoming_call")
    data object ActiveCall : Screen("active_call")
    data object PttCall : Screen("ptt_call")
}

data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val icon: ImageVector,
)

val bottomNavItems = listOf(
    BottomNavItem(Screen.Home, "Home", Icons.Default.Home),
    BottomNavItem(Screen.Contacts, "Contacts", Icons.Default.ContactPhone),
    BottomNavItem(Screen.Dial, "Dial", Icons.Default.Dialpad),
    BottomNavItem(Screen.History, "History", Icons.Default.History),
    BottomNavItem(Screen.Profile, "Profile", Icons.Default.Person),
)
