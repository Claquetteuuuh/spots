import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";

interface ColorWheelSheetProps {
  visible: boolean;
  onClose: () => void;
  /** A colour was chosen, as "#RRGGBB". */
  onPick: (hex: string) => void;
}

/**
 * A hue wheel with saturation and lightness sliders, drawn in a WebView
 * so it needs no native module. Shared by the spot form and the map's
 * colour filter.
 */
export function ColorWheelSheet({ visible, onClose, onPick }: ColorWheelSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
        <View
          style={{
            backgroundColor: theme.colors.bg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: theme.spacing.lg,
            paddingBottom: 40,
            height: 520,
          }}
          testID="color-wheel-sheet"
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold }}>
              {t("spots.pickColor")}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t("common.close")}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <WebView
            originWhitelist={["*"]}
            source={{
              html: `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,system-ui,sans-serif;padding:12px 16px;background:${theme.colors.bg};color:${theme.colors.text};overflow-y:auto;-webkit-overflow-scrolling:touch}
.wheel-wrap{position:relative;width:200px;height:200px;margin:0 auto 12px}
.wheel{width:100%;height:100%;border-radius:50%;background:conic-gradient(from 0deg,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))}
.pointer{position:absolute;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.5);transform:translate(-50%,-50%);pointer-events:none;z-index:2}
.sl{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.sl label{font-size:12px;min-width:72px;color:${theme.colors.textSecondary}}
.sl input[type=range]{flex:1;height:28px;accent-color:${theme.colors.accent}}
.preview-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.swatch{width:44px;height:44px;border-radius:8px;border:1px solid ${theme.colors.border}}
.hex{font-family:monospace;font-size:15px;font-weight:600}
.btn{display:block;width:100%;padding:14px;background:${theme.colors.accent};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent}
</style></head><body>
<div class="wheel-wrap" id="wrap">
  <div class="wheel" id="wheel"></div>
  <div class="pointer" id="ptr"></div>
</div>
<div class="sl"><label>Saturation</label><input type="range" id="sat" min="0" max="100" value="70"></div>
<div class="sl"><label>Lightness</label><input type="range" id="lit" min="0" max="100" value="50"></div>
<div class="preview-row"><div class="swatch" id="sw"></div><span class="hex" id="hx"></span></div>
<button class="btn" id="add">${t("spots.addColor")}</button>
<script>
var h=0,s=70,l=50,R=100;
function hsl2hex(h,s,l){var c=document.createElement('canvas');c.width=1;c.height=1;
var x=c.getContext('2d');x.fillStyle='hsl('+h+','+s+'%,'+l+'%)';x.fillRect(0,0,1,1);
var p=x.getImageData(0,0,1,1).data;
return '#'+[p[0],p[1],p[2]].map(function(v){return v.toString(16).padStart(2,'0')}).join('').toUpperCase()}
function movePtr(){var a=(h-90)*Math.PI/180;var r=R*0.75;var px=R+r*Math.cos(a);var py=R+r*Math.sin(a);
var ptr=document.getElementById('ptr');ptr.style.left=px+'px';ptr.style.top=py+'px';
ptr.style.backgroundColor='hsl('+h+','+s+'%,'+l+'%)'}
function upd(){var hex=hsl2hex(h,s,l);document.getElementById('sw').style.background='hsl('+h+','+s+'%,'+l+'%)';
document.getElementById('hx').textContent=hex;movePtr()}
function pickFromEvent(e){var t=e.touches?e.touches[0]:e;
var r=document.getElementById('wrap').getBoundingClientRect();
var cx=r.left+r.width/2,cy=r.top+r.height/2;
var angle=Math.atan2(t.clientY-cy,t.clientX-cx)*180/Math.PI;
h=Math.round((angle+90+360)%360);upd()}
var w=document.getElementById('wrap');
w.addEventListener('touchstart',function(e){e.preventDefault();pickFromEvent(e)},{passive:false});
w.addEventListener('touchmove',function(e){e.preventDefault();pickFromEvent(e)},{passive:false});
w.addEventListener('click',pickFromEvent);
document.getElementById('sat').addEventListener('input',function(){s=+this.value;upd()});
document.getElementById('lit').addEventListener('input',function(){l=+this.value;upd()});
document.getElementById('add').addEventListener('click',function(){
window.ReactNativeWebView.postMessage(document.getElementById('hx').textContent)});
upd();
</script></body></html>`,
            }}
            onMessage={(event) => {
              const hex = event.nativeEvent.data;
              if (/^#[0-9A-F]{6}$/.test(hex)) onPick(hex);
            }}
            style={{ flex: 1, backgroundColor: "transparent" }}
            javaScriptEnabled
            scrollEnabled
          />
        </View>
      </View>
    </Modal>
  );
}
