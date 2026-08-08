package com.clickkaar.dto.product;

import java.util.List;

public record ProductImportResponse(
    int importedCount,
    int skippedCount,
    List<String> errors,
    List<ProductResponse> products
) {
}
