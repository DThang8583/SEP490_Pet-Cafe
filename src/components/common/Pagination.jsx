import React from 'react';
import { Box, Stack, IconButton, Typography, Select, MenuItem, FormControl } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, FirstPage, LastPage } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';

/**
 * Pagination Component
 * 
 * @param {number} page - Current page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 * @param {number} itemsPerPage - Items per page (default: 10)
 * @param {function} onItemsPerPageChange - Callback when items per page changes
 * @param {number} totalItems - Total number of items
 * @param {boolean} showItemsPerPage - Show items per page selector (default: true)
 * @param {array} itemsPerPageOptions - Options for items per page (default: [5, 10, 20, 50])
 */
const Pagination = ({
    page = 1,
    totalPages = 1,
    onPageChange,
    itemsPerPage = 10,
    onItemsPerPageChange,
    totalItems = 0,
    showItemsPerPage = true,
    itemsPerPageOptions = [5, 10, 20, 50]
}) => {
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            onPageChange?.(newPage);
        }
    };

    const handleItemsPerPageChange = (event) => {
        onItemsPerPageChange?.(Number(event.target.value));
    };

    // Calculate display range
    const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
    const endItem = Math.min(page * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            let startPage = Math.max(2, page - 1);
            let endPage = Math.min(totalPages - 1, page + 1);

            // Adjust if near start
            if (page <= 3) {
                endPage = 4;
            }

            // Adjust if near end
            if (page >= totalPages - 2) {
                startPage = totalPages - 3;
            }

            // Add ellipsis if needed
            if (startPage > 2) {
                pages.push('...');
            }

            // Add middle pages
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Add ellipsis if needed
            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                py: 2,
                px: { xs: 1, sm: 2 }
            }}
        >
            {/* Items per page selector */}
            {showItemsPerPage && onItemsPerPageChange && (
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ order: { xs: 2, sm: 1 } }}
                >
                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.875rem' }}>
                        Hiển thị
                    </Typography>
                    <FormControl size="small">
                        <Select
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            sx={{
                                minWidth: 70,
                                height: 32,
                                fontSize: '0.875rem',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha(COLORS.GRAY[300], 0.5)
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: COLORS.GRAY[400]
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: COLORS.ERROR[500]
                                }
                            }}
                        >
                            {itemsPerPageOptions.map(option => (
                                <MenuItem key={option} value={option} sx={{ fontSize: '0.875rem' }}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, fontSize: '0.875rem' }}>
                        / trang
                    </Typography>
                </Stack>
            )}

            {/* Page info */}
            <Typography
                variant="body2"
                sx={{
                    color: COLORS.TEXT.SECONDARY,
                    fontSize: '0.875rem',
                    order: { xs: 3, sm: 2 }
                }}
            >
                Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> trong số <strong>{totalItems}</strong>
            </Typography>

            {/* Page navigation */}
            <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ order: { xs: 1, sm: 3 } }}
            >
                {/* First page */}
                <IconButton
                    size="small"
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    sx={{
                        color: COLORS.TEXT.SECONDARY,
                        '&:hover': {
                            bgcolor: alpha(COLORS.ERROR[100], 0.5)
                        },
                        '&.Mui-disabled': {
                            color: COLORS.TEXT.DISABLED
                        }
                    }}
                >
                    <FirstPage fontSize="small" />
                </IconButton>

                {/* Previous page */}
                <IconButton
                    size="small"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    sx={{
                        color: COLORS.TEXT.SECONDARY,
                        '&:hover': {
                            bgcolor: alpha(COLORS.ERROR[100], 0.5)
                        },
                        '&.Mui-disabled': {
                            color: COLORS.TEXT.DISABLED
                        }
                    }}
                >
                    <ChevronLeft fontSize="small" />
                </IconButton>

                {/* Page numbers */}
                {pageNumbers.map((pageNum, index) => (
                    pageNum === '...' ? (
                        <Box
                            key={`ellipsis-${index}`}
                            sx={{
                                px: 1,
                                color: COLORS.TEXT.SECONDARY,
                                fontSize: '0.875rem'
                            }}
                        >
                            ...
                        </Box>
                    ) : (
                        <IconButton
                            key={pageNum}
                            size="small"
                            onClick={() => handlePageChange(pageNum)}
                            sx={{
                                minWidth: 32,
                                height: 32,
                                borderRadius: 1,
                                fontSize: '0.875rem',
                                fontWeight: page === pageNum ? 700 : 400,
                                color: page === pageNum ? COLORS.COMMON.WHITE : COLORS.TEXT.PRIMARY,
                                bgcolor: page === pageNum ? COLORS.ERROR[500] : 'transparent',
                                '&:hover': {
                                    bgcolor: page === pageNum
                                        ? COLORS.ERROR[600]
                                        : alpha(COLORS.ERROR[100], 0.5)
                                }
                            }}
                        >
                            {pageNum}
                        </IconButton>
                    )
                ))}

                {/* Next page */}
                <IconButton
                    size="small"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    sx={{
                        color: COLORS.TEXT.SECONDARY,
                        '&:hover': {
                            bgcolor: alpha(COLORS.ERROR[100], 0.5)
                        },
                        '&.Mui-disabled': {
                            color: COLORS.TEXT.DISABLED
                        }
                    }}
                >
                    <ChevronRight fontSize="small" />
                </IconButton>

                {/* Last page */}
                <IconButton
                    size="small"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages}
                    sx={{
                        color: COLORS.TEXT.SECONDARY,
                        '&:hover': {
                            bgcolor: alpha(COLORS.ERROR[100], 0.5)
                        },
                        '&.Mui-disabled': {
                            color: COLORS.TEXT.DISABLED
                        }
                    }}
                >
                    <LastPage fontSize="small" />
                </IconButton>
            </Stack>
        </Box>
    );
};

export default Pagination;

