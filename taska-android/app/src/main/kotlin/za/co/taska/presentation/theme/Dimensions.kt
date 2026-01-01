package za.co.taska.presentation.theme

import androidx.compose.ui.unit.dp

/**
 * Taska Dimensions
 * Accessibility-focused sizing and spacing
 */

object TaskaDimensions {
    // Touch Targets (LARGE for accessibility - 56dp from spec)
    val touchTargetMinSize = 56.dp
    val buttonHeight = 56.dp
    val iconButtonSize = 56.dp
    val textFieldHeight = 56.dp

    // Spacing
    val spaceXXSmall = 2.dp
    val spaceXSmall = 4.dp
    val spaceSmall = 8.dp
    val spaceMedium = 16.dp
    val spaceLarge = 24.dp
    val spaceXLarge = 32.dp
    val spaceXXLarge = 48.dp

    // Padding
    val paddingXSmall = 4.dp
    val paddingSmall = 8.dp
    val paddingMedium = 16.dp
    val paddingLarge = 24.dp
    val paddingXLarge = 32.dp

    // Borders and Corners
    val cornerRadius = 12.dp
    val cornerRadiusSmall = 8.dp
    val cornerRadiusLarge = 16.dp
    val borderWidth = 2.dp
    val borderWidthThin = 1.dp

    // Icons
    val iconSmall = 20.dp
    val iconMedium = 28.dp
    val iconLarge = 36.dp
    val iconXLarge = 48.dp

    // Card
    val cardElevation = 2.dp
    val cardPadding = paddingMedium

    // Bottom Navigation
    val bottomNavHeight = 80.dp // Extra tall for accessibility

    // Images
    val profileImageSize = 48.dp
    val profileImageLargeSize = 96.dp
    val jobImageHeight = 200.dp
}
