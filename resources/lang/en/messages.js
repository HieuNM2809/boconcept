const crud = (label) => ({
    retrieved_all_success: `Retrieved ${label} list successfully.`,
    retrieved_one_success: `Retrieved ${label} successfully.`,
    created_success: `${label} created successfully.`,
    updated_success: `${label} updated successfully.`,
    deleted_success: `${label} deleted successfully.`,
    not_found: `${label} not found.`,
    failed_get_all: `Failed to retrieve ${label} list.`,
    failed_get_one: `Failed to retrieve ${label}.`,
    failed_create: `Failed to create ${label}.`,
    failed_update: `Failed to update ${label}.`,
    failed_delete: `Failed to delete ${label}.`,
});

module.exports = {
    example: crud('example'),
    category: crud('category'),
    product: crud('product'),
    auth: {
        invalid_credentials: 'Invalid credentials.',
        token_issued: 'Logged in successfully, token issued.',
        unauthorized: 'Unauthorized.',
    },
};
