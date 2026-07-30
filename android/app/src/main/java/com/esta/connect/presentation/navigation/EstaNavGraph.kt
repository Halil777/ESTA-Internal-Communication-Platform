package com.esta.connect.presentation.navigation

import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.esta.connect.MainActivity
import com.esta.connect.core.sip.SipCallState
import com.esta.connect.presentation.screens.auth.LoginScreen
import com.esta.connect.presentation.screens.auth.QrScanScreen
import com.esta.connect.presentation.screens.call.ActiveCallScreen
import com.esta.connect.presentation.screens.call.CallViewModel
import com.esta.connect.presentation.screens.call.IncomingCallScreen
import com.esta.connect.presentation.screens.call.PttCallScreen
import com.esta.connect.presentation.screens.contacts.ContactsScreen
import com.esta.connect.presentation.screens.dial.DialScreen
import com.esta.connect.presentation.screens.history.HistoryScreen
import com.esta.connect.presentation.screens.home.HomeScreen
import com.esta.connect.presentation.screens.profile.ProfileScreen

@Composable
fun EstaNavGraph(
    incomingCallIntent: Intent?,
) {
    val navController = rememberNavController()
    val callViewModel: CallViewModel = hiltViewModel()
    val callState by callViewModel.callState.collectAsState()
    val isLoggedIn by callViewModel.isLoggedIn.collectAsState()
    val isPttMode by callViewModel.isPttMode.collectAsState()

    // Navigate to call screens based on call state
    LaunchedEffect(callState, isPttMode) {
        when (callState) {
            is SipCallState.Incoming -> navController.navigate(Screen.IncomingCall.route) {
                launchSingleTop = true
            }
            is SipCallState.Outgoing -> {
                val route = if (isPttMode) Screen.PttCall.route else Screen.ActiveCall.route
                navController.navigate(route) { launchSingleTop = true }
            }
            is SipCallState.Connected -> {
                val route = if (isPttMode) Screen.PttCall.route else Screen.ActiveCall.route
                navController.navigate(route) {
                    launchSingleTop = true
                    popUpTo(Screen.IncomingCall.route) { inclusive = true }
                }
            }
            is SipCallState.Ended, is SipCallState.Idle -> {
                val current = navController.currentDestination?.route
                if (current == Screen.ActiveCall.route ||
                    current == Screen.IncomingCall.route ||
                    current == Screen.PttCall.route
                ) {
                    navController.popBackStack()
                }
            }
            else -> {}
        }
    }

    val startDestination = if (isLoggedIn) Screen.Home.route else Screen.Login.route
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute in bottomNavItems.map { it.screen.route }

    Scaffold(
        bottomBar = {
            AnimatedVisibility(
                visible = showBottomBar,
                enter = fadeIn() + slideInVertically { it },
                exit = fadeOut() + slideOutVertically { it },
            ) {
                EstaBottomNavBar(
                    navItems = bottomNavItems,
                    currentDestination = navBackStackEntry?.destination,
                    onItemClick = { item ->
                        navController.navigate(item.screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding),
        ) {
            // Auth
            composable(Screen.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onQrScanClick = { navController.navigate(Screen.QrScan.route) }
                )
            }
            composable(Screen.QrScan.route) {
                QrScanScreen(
                    onActivationSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onBack = { navController.popBackStack() }
                )
            }

            // Main screens
            composable(Screen.Home.route) {
                HomeScreen(
                    callViewModel = callViewModel,
                    onContactClick = { extension ->
                        callViewModel.makeCall(extension)
                    }
                )
            }
            composable(Screen.Contacts.route) {
                ContactsScreen(
                    onCallContact = { extension -> callViewModel.makeCall(extension) },
                    onPttContact  = { extension -> callViewModel.makePttCall(extension) },
                )
            }
            composable(Screen.Dial.route) {
                DialScreen(
                    onCall = { extension -> callViewModel.makeCall(extension) }
                )
            }
            composable(Screen.History.route) {
                HistoryScreen(
                    onCallBack = { extension -> callViewModel.makeCall(extension) }
                )
            }
            composable(Screen.Profile.route) {
                ProfileScreen(
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            // Call screens
            composable(Screen.IncomingCall.route) {
                IncomingCallScreen(
                    callViewModel = callViewModel,
                    onCallAnswered = {
                        navController.navigate(Screen.ActiveCall.route) {
                            popUpTo(Screen.IncomingCall.route) { inclusive = true }
                        }
                    },
                    onCallDeclined = { navController.popBackStack() }
                )
            }
            composable(Screen.ActiveCall.route) {
                ActiveCallScreen(
                    callViewModel = callViewModel,
                    onCallEnded = { navController.popBackStack() }
                )
            }
            composable(Screen.PttCall.route) {
                PttCallScreen(
                    callViewModel = callViewModel,
                    onCallEnded = { navController.popBackStack() }
                )
            }
        }
    }
}
