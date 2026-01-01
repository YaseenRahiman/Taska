package za.co.taska.presentation.permissions

import android.Manifest
import androidx.compose.material3.*
import androidx.compose.runtime.*
import com.google.accompanist.permissions.*

/**
 * Composable for handling location permission requests
 * Shows rationale dialog when needed
 */
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun LocationPermissionHandler(
    onPermissionGranted: () -> Unit,
    onPermissionDenied: () -> Unit,
    content: @Composable () -> Unit
) {
    val locationPermissionState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
    )

    var showRationaleDialog by remember { mutableStateOf(false) }

    LaunchedEffect(locationPermissionState.allPermissionsGranted) {
        if (locationPermissionState.allPermissionsGranted) {
            onPermissionGranted()
        }
    }

    if (showRationaleDialog) {
        AlertDialog(
            onDismissRequest = {
                showRationaleDialog = false
                onPermissionDenied()
            },
            title = { Text("Location Permission Required") },
            text = {
                Text(
                    "Taska needs your location to show you nearby jobs. " +
                    "This helps artisans find work close to them and saves travel time."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showRationaleDialog = false
                        locationPermissionState.launchMultiplePermissionRequest()
                    }
                ) {
                    Text("Grant Permission")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showRationaleDialog = false
                        onPermissionDenied()
                    }
                ) {
                    Text("Not Now")
                }
            }
        )
    }

    when {
        locationPermissionState.allPermissionsGranted -> {
            content()
        }
        locationPermissionState.shouldShowRationale -> {
            LaunchedEffect(Unit) {
                showRationaleDialog = true
            }
        }
        else -> {
            LaunchedEffect(Unit) {
                locationPermissionState.launchMultiplePermissionRequest()
            }
        }
    }
}
