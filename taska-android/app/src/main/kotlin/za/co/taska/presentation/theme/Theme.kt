package za.co.taska.presentation.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Taska Theme
 * Material 3 theme matching website design
 */

private val LightColorScheme = lightColorScheme(
    primary = Primary600,
    onPrimary = White,
    primaryContainer = Primary100,
    onPrimaryContainer = Primary600,

    secondary = Secondary600,
    onSecondary = White,
    secondaryContainer = Secondary300,
    onSecondaryContainer = Secondary600,

    tertiary = Accent600,
    onTertiary = White,
    tertiaryContainer = Accent300,
    onTertiaryContainer = Accent900,

    background = Cream50,
    onBackground = Gray900,

    surface = White,
    onSurface = Gray900,
    surfaceVariant = Cream100,
    onSurfaceVariant = Gray700,

    error = Error,
    onError = White,
    errorContainer = ErrorLight,
    onErrorContainer = Error,

    outline = Gray300,
    outlineVariant = Gray200
)

private val DarkColorScheme = darkColorScheme(
    primary = Primary500,
    onPrimary = Gray900,
    primaryContainer = Primary600,
    onPrimaryContainer = Primary100,

    secondary = Secondary500,
    onSecondary = White,
    secondaryContainer = Secondary600,
    onSecondaryContainer = Gray100,

    tertiary = Accent500,
    onTertiary = Gray900,
    tertiaryContainer = Accent600,
    onTertiaryContainer = Accent300,

    background = Gray900,
    onBackground = White,

    surface = Gray800,
    onSurface = White,
    surfaceVariant = Gray700,
    onSurfaceVariant = Gray300,

    error = Error,
    onError = White,
    errorContainer = ErrorLight,
    onErrorContainer = Error,

    outline = Gray600,
    outlineVariant = Gray700
)

@Composable
fun TaskaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = TaskaTypography,
        content = content
    )
}
