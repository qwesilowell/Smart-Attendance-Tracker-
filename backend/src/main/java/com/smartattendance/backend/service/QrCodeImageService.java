package com.smartattendance.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.smartattendance.backend.exception.QrCodeGenerationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
@Slf4j
public class QrCodeImageService {

    /**
     * Generate QR code image as Base64 string
     */
    public String generateQrCodeImage(String code) {
        return generateQrCodeImage(code, 300, 300);
    }

    /**
     * Generate QR code image as Base64 string with custom size
     */
    public String generateQrCodeImage(String code, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(code, BarcodeFormat.QR_CODE, width, height);

            BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(bufferedImage, "PNG", outputStream);

            byte[] imageBytes = outputStream.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            return "data:image/png;base64," + base64Image;

        } catch (WriterException | IOException e) {
            log.error("Error generating QR code for: {}", code, e);
            throw new QrCodeGenerationException("Failed to generate QR code image", e);
        }
    }

    /**
     * Generate QR code as byte array (for file download)
     */
    public byte[] generateQrCodeImageBytes(String code, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(code, BarcodeFormat.QR_CODE, width, height);

            BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(bufferedImage, "PNG", outputStream);

            return outputStream.toByteArray();

        } catch (WriterException | IOException e) {
            log.error("Error generating QR code bytes for: {}", code, e);
            throw new QrCodeGenerationException("Failed to generate QR code image", e);
        }
    }
}
