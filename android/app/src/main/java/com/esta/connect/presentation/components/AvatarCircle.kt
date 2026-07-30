package com.esta.connect.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

@Composable
fun AvatarCircle(
    name: String,
    size: Dp = 48.dp,
    avatarUrl: String? = null,
    modifier: Modifier = Modifier,
) {
    val initials = name.split(" ")
        .take(2)
        .mapNotNull { it.firstOrNull()?.uppercaseChar() }
        .joinToString("")
        .ifBlank { "?" }

    val bgColor = avatarColorForName(name)
    val fontSize = (size.value * 0.35f).sp

    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(bgColor),
        contentAlignment = Alignment.Center,
    ) {
        if (avatarUrl != null) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(size),
            )
        } else {
            Text(
                text = initials,
                color = Color.White,
                fontSize = fontSize,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

private val avatarColors = listOf(
    Color(0xFF1565C0), Color(0xFF00695C), Color(0xFF6A1B9A),
    Color(0xFFC62828), Color(0xFF2E7D32), Color(0xFF4527A0),
    Color(0xFF00838F), Color(0xFF558B2F), Color(0xFF283593),
)

private fun avatarColorForName(name: String): Color {
    val idx = name.hashCode().let { if (it < 0) -it else it } % avatarColors.size
    return avatarColors[idx]
}
