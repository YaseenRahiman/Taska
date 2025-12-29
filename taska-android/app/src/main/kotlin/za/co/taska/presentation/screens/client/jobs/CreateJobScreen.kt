package za.co.taska.presentation.screens.client.jobs

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import za.co.taska.domain.model.BudgetType
import za.co.taska.domain.model.Category
import za.co.taska.domain.model.UrgencyLevel
import za.co.taska.presentation.theme.Primary600

/**
 * Create Job screen - Form for posting new jobs
 * Includes category selection, job details, location, requirements, and images
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateJobScreen(
    onNavigateBack: () -> Unit = {},
    onJobCreated: (String) -> Unit = {},
    viewModel: CreateJobViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var requirementInput by remember { mutableStateOf("") }
    var showCategoryPicker by remember { mutableStateOf(false) }

    LaunchedEffect(state.jobCreated) {
        if (state.jobCreated) {
            onJobCreated("success")
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Post a Job",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Primary600,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
        bottomBar = {
            Surface(
                tonalElevation = 3.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.weight(1f),
                        enabled = !state.isLoading
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = { viewModel.createJob() },
                        modifier = Modifier.weight(1f),
                        enabled = state.canSubmit
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Post Job")
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // ========== CATEGORY SECTION ==========
            item {
                SectionHeader(
                    icon = Icons.Default.Work,
                    title = "Category"
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedButton(
                    onClick = { showCategoryPicker = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (state.selectedCategory != null)
                            MaterialTheme.colorScheme.primaryContainer
                        else MaterialTheme.colorScheme.surface
                    )
                ) {
                    Icon(Icons.Default.Work, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = state.selectedCategory?.name ?: "Select Category",
                        modifier = Modifier.weight(1f)
                    )
                    Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                }

                state.categoryError?.let { error ->
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(start = 16.dp, top = 4.dp)
                    )
                }
            }

            // ========== JOB DETAILS SECTION ==========
            item {
                SectionHeader(
                    icon = Icons.Default.Description,
                    title = "Job Details"
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = state.title,
                    onValueChange = { viewModel.updateTitle(it) },
                    label = { Text("Job Title") },
                    placeholder = { Text("e.g., Fix leaking kitchen tap") },
                    modifier = Modifier.fillMaxWidth(),
                    isError = state.titleError != null,
                    supportingText = {
                        Text(state.titleError ?: "${state.title.length}/100 characters")
                    },
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state.description,
                    onValueChange = { viewModel.updateDescription(it) },
                    label = { Text("Job Description") },
                    placeholder = { Text("Provide detailed information about the job...") },
                    modifier = Modifier.fillMaxWidth(),
                    isError = state.descriptionError != null,
                    supportingText = {
                        Text(state.descriptionError ?: "${state.description.length}/2000 characters")
                    },
                    minLines = 4,
                    maxLines = 6
                )
            }

            // ========== BUDGET SECTION ==========
            item {
                SectionHeader(
                    icon = Icons.Default.AttachMoney,
                    title = "Budget"
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = state.budget,
                        onValueChange = { viewModel.updateBudget(it) },
                        label = { Text("Amount (R)") },
                        placeholder = { Text("0") },
                        modifier = Modifier.weight(1f),
                        isError = state.budgetError != null,
                        supportingText = {
                            state.budgetError?.let { Text(it) }
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Budget Type",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    BudgetType.values().forEach { type ->
                        FilterChip(
                            selected = state.budgetType == type,
                            onClick = { viewModel.updateBudgetType(type) },
                            label = {
                                Text(
                                    when (type) {
                                        BudgetType.FIXED -> "Fixed"
                                        BudgetType.HOURLY -> "Hourly"
                                        BudgetType.NEGOTIABLE -> "Negotiable"
                                    }
                                )
                            }
                        )
                    }
                }
            }

            // ========== URGENCY SECTION ==========
            item {
                SectionHeader(
                    icon = Icons.Default.Schedule,
                    title = "Urgency"
                )

                Spacer(modifier = Modifier.height(8.dp))

                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    UrgencyLevel.values().forEach { level ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = state.urgency == level,
                                onClick = { viewModel.updateUrgency(level) }
                            )
                            Text(
                                text = when (level) {
                                    UrgencyLevel.LOW -> "Flexible"
                                    UrgencyLevel.MEDIUM -> "This week"
                                    UrgencyLevel.HIGH -> "Urgent"
                                    UrgencyLevel.URGENT -> "ASAP"
                                },
                                modifier = Modifier.padding(start = 8.dp)
                            )
                        }
                    }
                }
            }

            // ========== LOCATION SECTION ==========
            item {
                SectionHeader(
                    icon = Icons.Default.LocationOn,
                    title = "Location"
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = state.addressLine1,
                    onValueChange = { viewModel.updateAddressLine1(it) },
                    label = { Text("Street Address") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = state.addressLine2,
                    onValueChange = { viewModel.updateAddressLine2(it) },
                    label = { Text("Apartment, suite, etc. (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = state.city,
                        onValueChange = { viewModel.updateCity(it) },
                        label = { Text("City") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = state.postalCode,
                        onValueChange = { viewModel.updatePostalCode(it) },
                        label = { Text("Postal Code") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true
                    )
                }

                state.addressError?.let { error ->
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(start = 16.dp, top = 4.dp)
                    )
                }
            }

            // ========== REQUIREMENTS SECTION ==========
            item {
                SectionHeader(
                    icon = Icons.Default.Checklist,
                    title = "Requirements (Optional)"
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    OutlinedTextField(
                        value = requirementInput,
                        onValueChange = { requirementInput = it },
                        label = { Text("Add requirement") },
                        modifier = Modifier.weight(1f),
                        enabled = state.requirements.size < 10,
                        singleLine = true
                    )

                    IconButton(
                        onClick = {
                            if (requirementInput.isNotBlank()) {
                                viewModel.addRequirement(requirementInput)
                                requirementInput = ""
                            }
                        },
                        enabled = requirementInput.isNotBlank() && state.requirements.size < 10
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add requirement")
                    }
                }

                if (state.requirements.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }

            // Requirements list
            itemsIndexed(state.requirements) { index, requirement ->
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Primary600,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = requirement,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }

                        IconButton(
                            onClick = { viewModel.removeRequirement(index) },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Remove",
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }

            // Error message
            if (state.error != null) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Error,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error
                            )
                            Text(
                                text = state.error!!,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
            }
        }
    }

    // Category picker dialog
    if (showCategoryPicker) {
        CategoryPickerDialog(
            onDismiss = { showCategoryPicker = false },
            onCategorySelected = {
                viewModel.updateCategory(it)
                showCategoryPicker = false
            }
        )
    }
}

@Composable
private fun SectionHeader(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Primary600,
            modifier = Modifier.size(24.dp)
        )
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun CategoryPickerDialog(
    onDismiss: () -> Unit,
    onCategorySelected: (Category) -> Unit
) {
    // TODO: Fetch categories from API/database
    val mockCategories = listOf(
        Category("1", "Plumbing", null),
        Category("2", "Electrical", null),
        Category("3", "Carpentry", null),
        Category("4", "Painting", null),
        Category("5", "Gardening", null),
        Category("6", "Cleaning", null)
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Category") },
        text = {
            LazyColumn {
                itemsIndexed(mockCategories) { _, category ->
                    OutlinedCard(
                        onClick = { onCategorySelected(category) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = category.name,
                            modifier = Modifier.padding(16.dp),
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
