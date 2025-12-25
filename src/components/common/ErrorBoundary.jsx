import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // You can send error to logging service here
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary] caught', error, info);
        this.setState({ info });
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null, info: null });
        if (this.props.onReload) this.props.onReload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Đã xảy ra lỗi</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720, textAlign: 'center' }}>
                        Đã có lỗi phát sinh trong thành phần. Bạn có thể thử tải lại trang hoặc liên hệ quản trị hệ thống.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Button variant="contained" onClick={this.handleReload}>Tải lại</Button>
                        <Button variant="outlined" onClick={() => window.location.reload()}>Tải lại toàn bộ</Button>
                    </Box>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;


