<!DOCTYPE html>
<html>
<head>
    <title>Document Shared - DocuSmart</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #4f46e5; margin-top: 0;">DocuSmart Enterprise</h2>
        
        <p>Hello,</p>
        
        <p><strong>{{ $sender->name }}</strong> ({{ $sender->email }}) has shared a document with you on DocuSmart.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
            <h3 style="margin-top: 0; margin-bottom: 10px;">{{ $document->name }}</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px;">
                Role assigned: <strong>{{ strtoupper($role) }}</strong>
            </p>
        </div>
        
        <p>You can now access this document in your DocuSmart dashboard under the "Shared with Me" section.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p>This is an automated message from DocuSmart IDMS. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
